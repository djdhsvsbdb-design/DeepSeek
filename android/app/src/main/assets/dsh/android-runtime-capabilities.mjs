import { arch, platform, release } from 'node:os';
import { versions } from 'node:process';

export function getAndroidRuntimeCapabilities() {
  const android = platform() === 'android' || Boolean(process.env.ANDROID_ROOT || process.env.ANDROID_DATA);
  return Object.freeze({
    android,
    platform: platform(),
    architecture: arch(),
    release: release(),
    node: versions.node,
    supportsPty: false,
    supportsDesktopShell: false,
    supportsNativeWindow: false,
    supportsWebFetch: typeof fetch === 'function',
    supportsSubprocess: !android,
  });
}
