# Android port: initial integration audit

Date: 2026-11-13

## Confirmed source contracts

- `apps/web/src/main.ts` only waits for Host boot injections when `globalThis.dshDesktopBoot` exists. In that mode it requires `__DSH_BOOT_READY__`, then installs transport metadata and applies the Host injection graph.
- `@deepseek-ai/dsh-client-web` documents that `AppWebEntry.run()` needs the Host-provided `__ModuleLoader__` and boot graph. A plain WebView does not provide them.
- `apps/web/vite.config.ts` rejects Vite's dev/preview server as a standalone app. A successful static Vite build is not proof that the app can boot.
- The repository root requires Node `>=24.9.0` and pins pnpm `11.28.5`. The web workspace package is `@deepseek-ai/dsh-web-frontend`.

## Issues found and corrected in this branch

1. **False-positive web integration:** the initial Gradle pre-build task built and copied `apps/web/dist`, although Android had no Host boot contract. That would make MainActivity load a client unable to initialize instead of showing its explicit fallback. Removed the misleading build-and-copy task; the shell now remains visibly incomplete until Host integration exists.
2. **BuildConfig dependency:** MainActivity reads `BuildConfig.VERSION_NAME`. Explicitly enabled Android Gradle BuildConfig generation.
3. **WebView subresource policy:** navigation was restricted by host, but subresource requests were not. Added scheme + host checks and explicit 403 responses for external subresources.

## Remaining blockers (not bugs claimed as fixed)

- No Android Host, module loader, boot graph, RPC endpoint, or streaming transport.
- No Android replacements for Node APIs/native addons, PTY, Landlock, process execution, or plugin installation.
- No Gradle wrapper or Android instrumentation/unit tests yet.
- The app has not been compiled in this environment: this session has GitHub repository access, but no checked-out working tree, Android SDK, Gradle installation, or emulator is exposed. Therefore Kotlin/Gradle compilation and device behavior remain **unverified**.

## Next verification gate

On a machine with Android Studio/SDK 35 and JDK 17, import `android/`, run `:app:assembleDebug`, install on API 26+ and test startup, rotation, Back behavior, WebView lifecycle, and blocked external navigation/resources. Only after the Host exists should Web frontend build/boot tests be enabled.
