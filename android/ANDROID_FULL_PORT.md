# Android full-port implementation map

This document tracks the Android adaptation of the complete DSH Harness. It is a migration checklist, not a claim that the items are already implemented.

## Android target

Ship a native Android shell and embedded Node runtime, package the Harness's supported JavaScript modules and frontend assets inside the APK, and run the mobile-compatible profile without requiring a remote server or installing Node on the device.

## Workstreams

- [x] Native Android project and embedded Node bridge scaffold.
- [x] CI workflow for Android arm64 debug APK.
- [ ] Replace the smoke script with a packaged DSH profile entry point.
- [ ] Build and stage the Harness JS dependency closure and official bundles into app assets. (Frontend-only staging is now in CI; backend dependency bundling remains pending.)
- [ ] Add Android app-private filesystem adapter and persistent workspace/session storage.
- [ ] Add mobile-safe capability profile; omit unsupported subprocess/PTY, desktop, and native-only tools instead of exposing nonfunctional actions.
- [ ] Adapt app startup, profile configuration, provider/model settings and secrets storage.
- [x] Package the existing DSH client frontend into local app assets in CI (local APK assets only; it is not yet connected to an agent backend).
- [ ] Add log/error reporting and cancellation/foreground lifecycle handling.
- [ ] Add CI smoke tests that start a packaged profile and verify an actual agent response, not just a Node version.
- [ ] Test on a physical arm64 device, memory pressure, offline startup, and app restarts.

## Acceptance gate

An Android build is not considered a completed port until the APK launches the packaged Harness, loads the mobile profile, persists settings and sessions, and completes a real model turn on-device. Features that require desktop or unsupported OS capabilities must be explicitly disabled or adapted.


## Android agent entry-point progress

- [x] Add an Android-specific ESM carrier entry that imports the built `@deepseek-ai/dsh` installed CLI and requests the shipped `web` profile.
- [x] Change the Android launcher to invoke that entry instead of the Node smoke script.
- [ ] Build and stage the complete production dependency closure under `filesDir/dsh/runtime/node_modules`.
- [ ] Adapt the Web profile host/server lifecycle to Android and connect the local frontend to it.
- [ ] Audit and replace desktop-only filesystem, subprocess, terminal, sandbox, and native-addon capabilities.
- [ ] Verify a real provider-backed agent turn on arm64 Android.

The carrier intentionally exits with a clear diagnostic when the packaged CLI is absent. It does not silently claim that the agent started. The current APK workflow still does not stage the complete CLI installation, so this is an entry-point integration, not a completed agent port.
