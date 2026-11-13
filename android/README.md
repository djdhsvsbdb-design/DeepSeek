# DeepSeek Harness for Android

This directory starts the native Android application track. It is intentionally separate from the Electron desktop app.

## Current status

- Native Android application shell: added (Kotlin Activity + WebView).
- Existing React client: build-and-copy task wired into the Android Gradle build.
- Android-specific Harness runtime: **not implemented yet**.
- Agent execution, local tools, plugin lifecycle, terminal/process support, secure filesystem access, and session persistence: still need Android implementations or explicitly supported alternatives.

The existing Web entry expects a boot manifest and a running Harness host. The Android shell does not pretend that a WebView alone supplies that host. The current build wiring is the UI integration starting point; runtime integration is the next required milestone.

## Build

Requirements: Android Studio with Android SDK 35, JDK 17, Node.js and pnpm versions matching the repository root.

1. From the repository root, install workspace dependencies with the repository's documented pnpm workflow.
2. Open this directory in Android Studio.
3. Build the `:app` debug variant. The Gradle pre-build task builds `apps/web` and copies its output into the app assets.

The first build may need internet access to resolve Gradle and pnpm dependencies.

## Android port plan

1. Define an Android runtime contract for profile boot, readiness, RPC, streams, shutdown, and app-private storage.
2. Replace the Electron Host with an Android Host implementation and connect it to the existing Web client boot-injection contract.
3. Audit every Node/native dependency used by the selected profile. Keep portable TypeScript modules; replace POSIX, Landlock, PTY, and Electron-only boundaries with Android-compatible implementations.
4. Port the filesystem, process/terminal, credentials, plugin installation, and sandbox capabilities one by one, with explicit capability reporting where Android cannot provide equivalent behavior.
5. Add instrumentation tests and a reproducible APK/AAB build.

Do not enable a capability in the Android profile until its implementation and tests exist.
