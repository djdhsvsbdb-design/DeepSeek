# DeepSeek Harness for Android

This directory starts the native Android application track. It is intentionally separate from the Electron desktop app.

## Current status

- Native Android application shell: added (Kotlin Activity + WebView).
- Android WebView navigation and subresource requests: restricted to the app asset origin.
- Android-specific Harness runtime: **not implemented yet**.
- Agent execution, local tools, plugin lifecycle, terminal/process support, secure filesystem access, and session persistence: still need Android implementations or explicitly supported alternatives.
- The existing React client is **not bundled** yet: it requires a Host boot graph, module loader, injections, and RPC/stream transport that this Android shell does not provide.

The shell deliberately shows a setup page instead of loading a client that cannot boot. This avoids presenting a blank or broken UI as a working application.

## Build

Requirements: Android Studio with Android SDK 35 and JDK 17.

1. Open this directory in Android Studio.
2. Build the `:app` debug variant.

The Android shell build is independent of the repository's pnpm workspace. The project does not yet include a Gradle wrapper; Android Studio can import the Gradle project using an installed compatible Gradle distribution.

## Android port plan

1. Define an Android runtime contract for profile boot, readiness, RPC, streams, shutdown, and app-private storage.
2. Replace the Electron Host with an Android Host implementation and connect it to the existing Web client boot-injection contract.
3. Audit every Node/native dependency used by the selected profile. Keep portable TypeScript modules; replace POSIX, Landlock, PTY, and Electron-only boundaries with Android-compatible implementations.
4. Port the filesystem, process/terminal, credentials, plugin installation, and sandbox capabilities one by one, with explicit capability reporting where Android cannot provide equivalent behavior.
5. Add instrumentation tests and a reproducible APK/AAB build.

Do not enable a capability in the Android profile until its implementation and tests exist.
