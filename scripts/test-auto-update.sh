#!/bin/bash

# Script to help test auto-updates
set -e

echo "🚀 Auto-Update Testing Helper"
echo "============================"

# Check current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Function to bump version
bump_version() {
    echo "📝 Bumping version..."
    npm version patch --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "New version: $NEW_VERSION"
}

# Function to build
build_app() {
    echo "🔨 Building app..."
    npm run dist:mac  # Change to dist:win or dist:linux as needed
}

# Function to create release
create_release() {
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "📦 Creating GitHub release..."
    
    # Find the built files
    if [ -f "./dist/make/Datagres.dmg" ]; then
        RELEASE_FILE="./dist/make/Datagres.dmg"
    elif [ -f "./dist/make/zip/darwin/arm64/Datagres-darwin-arm64-${NEW_VERSION}.zip" ]; then
        RELEASE_FILE="./dist/make/zip/darwin/arm64/Datagres-darwin-arm64-${NEW_VERSION}.zip"
    else
        echo "❌ Could not find release file!"
        exit 1
    fi
    
    echo "Found release file: $RELEASE_FILE"
    
    # Create draft release
    gh release create "v${NEW_VERSION}" \
        --draft \
        --title "v${NEW_VERSION} - Test Update" \
        --notes "Test release for auto-update functionality
        
## What's New
- Testing auto-update functionality
- This is a test release

## Testing Instructions
1. Install the previous version
2. Run the app
3. Check for updates from Help menu
4. Verify update notification appears" \
        "$RELEASE_FILE"
    
    echo "✅ Draft release created! Visit GitHub to publish it."
    echo "   https://github.com/seepatcode/datagres/releases"
}

# Main menu
echo ""
echo "What would you like to do?"
echo "1) Build current version"
echo "2) Bump version and build"
echo "3) Create GitHub release from existing build"
echo "4) Full test cycle (bump, build, create release)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        build_app
        ;;
    2)
        bump_version
        build_app
        ;;
    3)
        create_release
        ;;
    4)
        bump_version
        build_app
        create_release
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✨ Done!"
echo ""
echo "Next steps:"
echo "1. Install the OLDER version of the app"
echo "2. Run the installed app (not from terminal/development)"
echo "3. Publish the draft release on GitHub"
echo "4. In the app: Help → Check for Updates"
echo "5. Watch the magic happen! 🎉"