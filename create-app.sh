#!/bin/bash

echo "Creating macOS App Bundle..."

# Get current directory
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create app bundle structure
mkdir -p "$APP_DIR/WardleyMaps.app/Contents/MacOS"
mkdir -p "$APP_DIR/WardleyMaps.app/Contents/Resources"

# Create executable
cat > "$APP_DIR/WardleyMaps.app/Contents/MacOS/WardleyMaps" << 'EOF'
#!/bin/bash
APP_PATH="$(dirname "$(dirname "$(dirname "$0")")")"
osascript -e 'tell application "Terminal"
    do script "'"$APP_PATH"'/start-app.command"
    activate
end tell'
EOF

chmod +x "$APP_DIR/WardleyMaps.app/Contents/MacOS/WardleyMaps"

# Create Info.plist
cat > "$APP_DIR/WardleyMaps.app/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>WardleyMaps</string>
    <key>CFBundleIdentifier</key>
    <string>com.wardleymaps.app</string>
    <key>CFBundleName</key>
    <string>Wardley Maps</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.10</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

echo "✅ App Bundle created: WardleyMaps.app"
echo "You can now move WardleyMaps.app to your Applications folder"