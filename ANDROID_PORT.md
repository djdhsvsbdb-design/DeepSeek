# Android Port: Runtime Migration

Status: **port work started; runtime not integrated yet**.

This branch is the Android-port work branch. The previous `android-github-build` branch remains an APK wrapper proof-of-concept and must not be presented as a native Harness port.

## Verified constraints

- The Harness workspace requires Node.js `>=24.9.0` (root `package.json`).
- The CLI is a profile launcher and expects the installed application/runtime packages, not a generic Node script.
- The Android scaffold currently only loads a remote server URL in a WebView; that behavior is not the target.
- Historical `nodejs-mobile/nodejs-mobile` releases surfaced in research are Node 18.x, too old for the declared Node 24.9 minimum.
- A separate community mobile Node 24 build recipe exists, but its repository is small, has a non-standard `NOASSERTION` license metadata field, and no GitHub Releases entry found during this check. Do not bundle it until source provenance, patches, artifacts, license obligations, and runtime compatibility have been audited.
- Android has restrictions around process creation and native addons. Harness packages that depend on subprocesses, native modules, filesystem access, or desktop-specific behavior need explicit porting decisions and tests.

## Target architecture

1. **Embedded runtime:** Bundle a maintained Android ARM64 Node 24+ runtime compatible with the app's JDK/NDK toolchain. Verify its ABI, license, release provenance, and runtime APIs before selecting it.
2. **App-private runtime files:** Package a production build of the Harness and its required workspace dependencies into app assets; extract to app-private storage on first launch and update atomically.
3. **Runtime bridge:** Implement a Java/Kotlin service that starts Node in a background thread, passes the app-private paths/environment, captures stdout/stderr, and provides lifecycle control without blocking the UI.
4. **Android-compatible profile:** Create a dedicated minimal profile, removing or replacing unsupported desktop/process/native features. Keep core agent loop, model providers, and essential tools only after their dependency graph is verified.
5. **Native UI:** Replace the remote URL WebView with an Android UI for runtime status, model/provider configuration, conversation/session controls, logs, and permissions.
6. **Build and test:** CI must build APK for arm64, run runtime smoke tests (Node version, module loading, HTTP server bind to loopback, app-private file access), and publish APK only if tests pass.

## First acceptance gate

The port is **not considered functional** until an installed APK starts the bundled Node runtime offline, prints its Node version, loads a Harness package, and starts a local loopback endpoint without a remote DSH server.

## Current work

- Created branch `android-runtime-port` from `android-github-build`.
- Audited the old mobile Node releases: Node 18.x is below Harness's Node 24.9 minimum.
- Identified a community Node 24 Android build recipe as a possible candidate, but provenance and license require checking before integration.
- No runtime integration or APK test has been completed yet.
