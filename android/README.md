# DSH Android Port (in progress)

This branch is the native Android port work, not the old WebView server wrapper.

## Current implemented slice

- Android Java UI with a button to launch the embedded Node process.
- JNI bridge calling Node's `node::Start()`.
- App-private `HOME`, `TMPDIR`, and portable Node compile-cache paths.
- A packaged smoke script to print Node version and architecture.
- GitHub Actions workflow that builds the pinned Node 24 mobile runtime for arm64, stages `libnode.so` and headers, and builds a debug APK.

## Build

Use GitHub Actions workflow **Android Node Runtime** on branch `android-runtime-port`. The workflow is configured to build the Node mobile source from its recipe, package the runtime in an arm64 APK, and publish an artifact after a successful build.

## Important status

**This is not yet a full Harness port.** The current app only attempts to start embedded Node with a smoke script. The Harness workspace and its dependency bundle have not yet been packaged into the app; profile/module compatibility and runtime smoke verification are still pending. A successful APK build alone is not proof that the agent works.
