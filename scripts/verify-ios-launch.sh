#!/usr/bin/env bash
set -euo pipefail

CHECK_DIR="$GITHUB_WORKSPACE/work/ios-launch"
mkdir -p "$CHECK_DIR"
xcodebuild build \
  -workspace "$GITHUB_WORKSPACE/apps/offline/ios/Core.xcworkspace" \
  -scheme Core -configuration Release \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$CHECK_DIR/build" \
  CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY='' \
  2>&1 | tee "$CHECK_DIR/build.log" | xcbeautify

DEVICE_ID=$(xcrun simctl list devices available --json | python3 -c '
import json, sys
devices = [d for group in json.load(sys.stdin)["devices"].values() for d in group]
print(next(d["udid"] for d in devices if d.get("isAvailable") and "iPhone" in d["name"]))
')
xcrun simctl boot "$DEVICE_ID" || true
xcrun simctl bootstatus "$DEVICE_ID" -b
xcrun simctl status_bar "$DEVICE_ID" override --time '09:41' --batteryState charged --batteryLevel 100
xcrun simctl install "$DEVICE_ID" "$CHECK_DIR/build/Build/Products/Release-iphonesimulator/Core.app"
xcrun simctl launch --terminate-running-process "$DEVICE_ID" br.com.corepersonal.offline

# Capture the actual native startup: black launch, logo fade and first app screen.
for n in $(seq -w 1 14); do
  xcrun simctl io "$DEVICE_ID" screenshot --type=png "$CHECK_DIR/launch-$n.png" >/dev/null 2>&1
  sleep 0.15
done
xcrun simctl shutdown "$DEVICE_ID"
