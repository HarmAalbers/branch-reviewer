#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTBridgeModule.h>

// Lightweight native Git module implemented inside AppDelegate translation unit
// to avoid touching the Xcode project structure. Exposes a single async method
// `scanRepo(path)` that shells out to `git` and returns JSON with branches,
// current/base branch, commits per branch, and changed files.
@interface BRGit : NSObject <RCTBridgeModule>
@end

@implementation BRGit
RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue { return dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0); }

+ (NSString *)runGit:(NSArray<NSString *> *)args cwd:(NSString *)cwd error:(NSError **)error
{
  NSTask *task = [[NSTask alloc] init];
  task.launchPath = @"/usr/bin/env";
  task.arguments = [@[ @"git" ] arrayByAddingObjectsFromArray:args];
  task.currentDirectoryPath = cwd;

  // Ensure PATH has Homebrew locations for git
  NSMutableDictionary *env = [[[NSProcessInfo processInfo] environment] mutableCopy];
  NSString *path = env[@"PATH"] ?: @"";
  env[@"PATH"] = [NSString stringWithFormat:@"/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:%@", path];
  task.environment = env;

  NSPipe *stdoutPipe = [NSPipe pipe];
  NSPipe *stderrPipe = [NSPipe pipe];
  task.standardOutput = stdoutPipe;
  task.standardError = stderrPipe;

  @try {
    [task launch];
    [task waitUntilExit];
  } @catch (NSException *e) {
    if (error) *error = [NSError errorWithDomain:@"BRGit" code:-1 userInfo:@{NSLocalizedDescriptionKey: e.reason ?: @"Failed to launch git"}];
    return nil;
  }

  NSData *outData = [[stdoutPipe fileHandleForReading] readDataToEndOfFile];
  NSData *errData = [[stderrPipe fileHandleForReading] readDataToEndOfFile];
  int status = task.terminationStatus;
  if (status != 0) {
    if (error) *error = [NSError errorWithDomain:@"BRGit" code:status userInfo:@{NSLocalizedDescriptionKey: [[NSString alloc] initWithData:errData encoding:NSUTF8StringEncoding] ?: @"git failed"}];
    return nil;
  }
  return [[NSString alloc] initWithData:outData encoding:NSUTF8StringEncoding] ?: @"";
}

+ (NSArray<NSString *> *)lines:(NSString *)s {
  if (!s) return @[];
  NSMutableArray *arr = [NSMutableArray array];
  [s enumerateLinesUsingBlock:^(NSString * _Nonnull line, BOOL * _Nonnull stop) {
    [arr addObject:line];
  }];
  return arr;
}

+ (NSString *)trim:(NSString *)s {
  return [s stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
}

RCT_REMAP_METHOD(pickFolder,
                 pickFolderWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    [panel setCanChooseFiles:NO];
    [panel setCanChooseDirectories:YES];
    [panel setAllowsMultipleSelection:NO];
    [panel setMessage:@"Select a Git repository folder"];
    [panel setPrompt:@"Select"];

    [panel beginWithCompletionHandler:^(NSModalResponse result) {
      if (result == NSModalResponseOK) {
        NSURL *url = [[panel URLs] firstObject];
        if (url) {
          resolve([url path]);
        } else {
          reject(@"ENOPATH", @"No path selected", nil);
        }
      } else {
        reject(@"ECANCELLED", @"User cancelled folder selection", nil);
      }
    }];
  });
}

RCT_REMAP_METHOD(scanBranch,
                 scanBranchWithPath:(NSString *)path
                 branchName:(NSString *)branchName
                 baseBranch:(NSString *)baseBranch
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSError *err = nil;
  NSString *range = [NSString stringWithFormat:@"%@..%@", baseBranch, branchName];

  // Get commits
  NSString *log = [BRGit runGit:@[ @"log", @"--date=iso", @"--pretty=format:%H\x1f%an\x1f%ad\x1f%s", @"-n", @"100", range ] cwd:path error:&err];
  if (err) {
    reject(@"EGIT", @"Failed to get commits", err);
    return;
  }

  NSMutableArray *commits = [NSMutableArray array];
  for (NSString *l in [BRGit lines:log]) {
    if (l.length == 0) continue;
    NSArray *cols = [l componentsSeparatedByString:@"\x1f"];
    if (cols.count < 4) continue;
    [commits addObject:@{ @"hash": cols[0], @"author": cols[1], @"dateISO": cols[2], @"message": cols[3] }];
  }

  // Get files
  NSString *diff = [BRGit runGit:@[ @"diff", @"--unified=2", range ] cwd:path error:&err];
  if (err) {
    reject(@"EGIT", @"Failed to get diff", err);
    return;
  }

  NSMutableArray *files = [NSMutableArray array];
  NSArray *lines = [BRGit lines:diff];
  NSMutableArray *curPatch = nil;
  NSString *curPath = nil;
  int adds = 0, dels = 0;
  int patchLineCount = 0;

  for (NSString *line in lines) {
    if ([line hasPrefix:@"diff --git a/"]) {
      if (curPath != nil) {
        [files addObject:@{ @"path": curPath, @"additions": @(adds), @"deletions": @(dels), @"patch": curPatch ?: @[] }];
        if (files.count >= 50) break;
      }
      NSArray *parts = [line componentsSeparatedByString:@" b/"];
      if (parts.count >= 2) {
        curPath = [BRGit trim:parts.lastObject];
      } else {
        curPath = @"?";
      }
      curPatch = [NSMutableArray array];
      adds = 0; dels = 0;
      patchLineCount = 0;
      [curPatch addObject:line];
      patchLineCount++;
      continue;
    }
    if (curPatch && patchLineCount < 200) {
      [curPatch addObject:line];
      patchLineCount++;
      if ([line hasPrefix:@"+"] && ![line hasPrefix:@"+++"]) adds++;
      if ([line hasPrefix:@"-"] && ![line hasPrefix:@"---"]) dels++;
    }
  }
  if (curPath != nil && files.count < 50) {
    [files addObject:@{ @"path": curPath, @"additions": @(adds), @"deletions": @(dels), @"patch": curPatch ?: @[] }];
  }

  NSDictionary *result = @{ @"commits": commits, @"files": files };
  resolve(result);
}

RCT_REMAP_METHOD(scanRepo,
                 scanRepoWithPath:(NSString *)path
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSLog(@"[BRGit] scanRepo started for path: %@", path);
  NSError *err = nil;

  // Verify this is a git repo
  NSLog(@"[BRGit] Verifying git repository...");
  NSString *isGit = [BRGit runGit:@[ @"rev-parse", @"--is-inside-work-tree" ] cwd:path error:&err];
  if (isGit == nil || ![[BRGit trim:isGit] isEqualToString:@"true"]) {
    NSLog(@"[BRGit] Not a git repository!");
    reject(@"ENOTGIT", @"Not a git repository", err);
    return;
  }
  NSLog(@"[BRGit] Git repository verified");

  // Current branch
  NSLog(@"[BRGit] Getting current branch...");
  NSString *current = [BRGit trim:[BRGit runGit:@[ @"rev-parse", @"--abbrev-ref", @"HEAD" ] cwd:path error:&err] ?: @""];
  NSLog(@"[BRGit] Current branch: %@", current);

  // Base branch: prefer origin/HEAD, else main/master
  NSLog(@"[BRGit] Determining base branch...");
  NSString *originHead = [BRGit runGit:@[ @"symbolic-ref", @"refs/remotes/origin/HEAD" ] cwd:path error:nil];
  NSString *base = nil;
  if (originHead.length > 0) {
    // Example: refs/remotes/origin/main
    NSArray *parts = [originHead componentsSeparatedByString:@"/"]; // pick last
    base = [BRGit trim:parts.lastObject];
  }
  if (base.length == 0) {
    if ([BRGit runGit:@[ @"rev-parse", @"--verify", @"main" ] cwd:path error:nil]) base = @"main";
  }
  if (base.length == 0) {
    if ([BRGit runGit:@[ @"rev-parse", @"--verify", @"master" ] cwd:path error:nil]) base = @"master";
  }
  if (base.length == 0) base = @"main";
  NSLog(@"[BRGit] Base branch: %@", base);

  // Branch list
  NSLog(@"[BRGit] Getting branch list...");
  NSString *branchesRaw = [BRGit runGit:@[ @"branch", @"--list" ] cwd:path error:&err];
  NSArray *branchLines = [BRGit lines:branchesRaw];
  NSMutableArray *branches = [NSMutableArray array];
  for (NSString *line in branchLines) {
    NSString *t = [BRGit trim:line];
    BOOL isCur = [t hasPrefix:@"*"]; // lines like "* main"
    if (isCur) t = [BRGit trim:[t substringFromIndex:1]];
    if (t.length == 0) continue;
    [branches addObject:@{ @"name": t, @"isCurrent": @(isCur) }];
  }
  NSLog(@"[BRGit] Found %lu branches", (unsigned long)branches.count);

  // Only load commits/files for current branch initially (for speed)
  // Other branches will be loaded on-demand when selected
  NSMutableDictionary *branchCommits = [NSMutableDictionary dictionary];
  NSMutableDictionary *branchFiles = [NSMutableDictionary dictionary];

  if (current.length > 0) {
    NSString *range = [NSString stringWithFormat:@"%@..%@", base, current];

    // Get commits for current branch
    NSLog(@"[BRGit] Getting commits for current branch '%@' (range: %@)...", current, range);
    NSString *log = [BRGit runGit:@[ @"log", @"--date=iso", @"--pretty=format:%H\x1f%an\x1f%ad\x1f%s", @"-n", @"100", range ] cwd:path error:nil] ?: @"";
    NSMutableArray *commits = [NSMutableArray array];
    for (NSString *l in [BRGit lines:log]) {
      if (l.length == 0) continue;
      NSArray *cols = [l componentsSeparatedByString:@"\x1f"];
      if (cols.count < 4) continue;
      [commits addObject:@{ @"hash": cols[0], @"author": cols[1], @"dateISO": cols[2], @"message": cols[3] }];
    }
    branchCommits[current] = commits;
    NSLog(@"[BRGit] Found %lu commits", (unsigned long)commits.count);

    // Get files for current branch (use --numstat for speed, no patches initially)
    NSLog(@"[BRGit] Getting file list for current branch (fast mode)...");
    NSString *numstat = [BRGit runGit:@[ @"diff", @"--numstat", range ] cwd:path error:nil] ?: @"";
    NSLog(@"[BRGit] Numstat returned %lu characters", (unsigned long)numstat.length);
    NSMutableArray *files = [NSMutableArray array];

    // Parse numstat output: "additions\tdeletions\tfilename"
    for (NSString *line in [BRGit lines:numstat]) {
      if (line.length == 0) continue;
      NSArray *parts = [line componentsSeparatedByString:@"\t"];
      if (parts.count < 3) continue;

      NSString *addsStr = parts[0];
      NSString *delsStr = parts[1];
      NSString *path = parts[2];

      int adds = [addsStr isEqualToString:@"-"] ? 0 : [addsStr intValue];
      int dels = [delsStr isEqualToString:@"-"] ? 0 : [delsStr intValue];

      // Store file info with empty patch (will be loaded on demand)
      [files addObject:@{ @"path": path, @"additions": @(adds), @"deletions": @(dels), @"patch": @[] }];

      if (files.count >= 50) break; // Limit to 50 files
    }
    branchFiles[current] = files;
    NSLog(@"[BRGit] Processed %lu files", (unsigned long)files.count);
  }

  NSLog(@"[BRGit] scanRepo complete, returning result");
  NSDictionary *result = @{ @"branches": branches,
                             @"currentBranch": current ?: @"",
                             @"baseBranch": base ?: @"main",
                             @"branchCommits": branchCommits,
                             @"branchFiles": branchFiles };
  resolve(result);
}
@end

@implementation AppDelegate

- (void)applicationDidFinishLaunching:(NSNotification *)notification
{
  self.moduleName = @"branchReviewer";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

  return [super applicationDidFinishLaunching:notification];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  // Prefer Metro in Debug, but if a pre-bundled file exists, use it to allow running without Metro.
  NSURL *bundledURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  if (bundledURL != nil) {
    return bundledURL;
  }
  // Ensure packager access is allowed (should be by default in Debug, but make it explicit)
  RCTBundleURLProviderAllowPackagerServerAccess(YES);
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  // In Release we expect the bundle to be packaged by the Xcode build script.
  NSURL *fileURL = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  if (fileURL != nil) {
    return fileURL;
  }
  // Fallback: allow connecting to a local Metro server if the release app is run locally without a bundle.
  RCTBundleURLProviderAllowPackagerServerAccess(YES);
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
#ifdef RN_FABRIC_ENABLED
  return true;
#else
  return false;
#endif
}

@end
