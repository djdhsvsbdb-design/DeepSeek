# DSH Mobile (initial Android client scaffold)

This branch adds an Android APK build scaffold and a WebView client for an existing DeepSeek Harness web server.

**Important:** this is not yet a standalone/on-device DeepSeek Harness port. The app connects to a DSH server URL that you enter in the app. It does not bundle the Node runtime or execute the agent locally on Android.

## Build APK on GitHub

1. Open the repository's **Actions** tab.
2. Select **Android APK**.
3. Press **Run workflow** (or push a change to this branch to trigger it).
4. Download the artifact named `deepseek-harness-android-debug` from the completed run.

The APK is debug-signed and intended for testing.

## Build locally

Requires JDK 17 and Gradle 8.7:

```sh
gradle -p android assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

## Current limitations

- Requires a reachable DSH web server.
- No embedded Node.js runtime yet.
- No local agent process, terminal, file tools, or offline engine.
- WebView JavaScript is enabled because the DSH web interface needs it; file/content access is disabled.

The next engineering phase for a standalone Android port is embedding a compatible Node runtime and packaging the DSH server and dependencies. That is substantially more than a WebView wrapper.
