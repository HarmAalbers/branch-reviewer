# Justfile — branchReviewer macOS (React Native macOS)
# Requires: https://github.com/casey/just

# Use bash with safer defaults
set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

# Default target: list available recipes
default:
    @just --list

# Install JavaScript dependencies
install:
    npm install

# Start Metro bundler
start:
    npm start

# Bundle JS for macOS (produces macos/main.jsbundle and assets)
bundle-macos:
    npm run bundle:macos

# (Re)install CocoaPods for macOS
pods:
    cd macos && pod install

# Run the macOS app (starts Metro separately)
macos:
    npm run macos

# Run tests
test:
    npm test

# Lint code
lint:
    npm run lint

# Type-check with TypeScript
typecheck:
    npx tsc --noEmit

# Format code with Prettier
fmt:
    npx prettier --write .

# Reset Metro cache (does not start Metro)
clean-metro-cache:
    rm -rf .metro-cache ${TMPDIR:-/tmp}/metro-* 2>/dev/null || true
    if command -v watchman >/dev/null; then watchman watch-del-all || true; fi

# Reseed Watchman for this project only (helps resolve recrawl warnings)
watchman-reseed:
    if command -v watchman >/dev/null; then watchman watch-del "$PWD" || true; watchman watch-project "$PWD"; else echo "Watchman not installed"; fi

# Full clean: remove node_modules and reinstall
clean:
    rm -rf node_modules
    npm install

# Build release .app via xcodebuild
build-app:
    xcodebuild -workspace macos/branchReviewer.xcworkspace \
      -scheme branchReviewer-macOS \
      -configuration Release \
      -arch arm64 \
      build

# Create an unsigned DMG from Release .app (if present)
package-dmg:
    APP_PATH="$(find ~/Library/Developer/Xcode/DerivedData -name branchReviewer.app -path "*Build/Products/Release/*" -print -quit)" && \
    [ -d "$APP_PATH" ] && hdiutil create -volname "Branch Reviewer" -srcfolder "$APP_PATH" -ov -format UDZO branchReviewer-unsigned.dmg && \
    echo "Created branchReviewer-unsigned.dmg" || echo "Release .app not found. Run: just build-app"

# Environment versions
versions:
    node -v
    npm -v
    npx react-native --version
    ruby -v || true
    if command -v pod >/dev/null; then pod --version; else echo "CocoaPods not found"; fi

# Help with common flows
help:
    @echo "Common flows:"
    @echo "  just dev               # Install deps + pods, start Metro, run app (one-shot)"
    @echo "  just up                # Alias for dev"
    @echo "  just run-all           # Alias for dev"
    @echo "  just start             # Start Metro"
    @echo "  just pods              # Install CocoaPods for macOS"
    @echo "  just macos             # Launch macOS app"
    @echo "  just build-app         # Build Release .app"
    @echo "  just package-dmg       # Create unsigned DMG from Release .app"
    @echo "  just bundle-macos      # Produce main.jsbundle for offline runs"
    @echo "  just test              # Run tests"
    @echo "  just lint              # Lint code"
    @echo "  just typecheck         # TypeScript check"
    @echo "  just fmt               # Format code"
    @echo "  just clean             # Reinstall deps"
    @echo "  just clean-metro-cache # Reset Metro cache"
    @echo "  just watchman-reseed   # Reset this project's Watchman watch"
    @echo "  just versions          # Show tool versions"

# One-shot dev: install pods (via deps), start Metro in background, then run app
# Stops Metro when this recipe exits
dev: install pods
    ( METRO_PID=""; PORT=""; for p in 8081 8082 8083 8084 8085 8086 8087 8088 8089 8090; do if ! lsof -iTCP:$p -sTCP:LISTEN -n -P >/dev/null 2>&1; then PORT=$p; break; fi; done; if [ -z "$PORT" ]; then echo "No free port found in 8081-8090"; exit 1; fi; echo "Starting Metro on port $PORT..."; npm start -- --port "$PORT" & METRO_PID=$!; trap 'kill -TERM "$METRO_PID" 2>/dev/null || true' EXIT; sleep 2; RCT_METRO_PORT="$PORT" npm run macos -- --port "$PORT" )

# Convenience aliases
up: dev
run-all: dev
