export async function checkAndroidNetwork({ timeoutMs = 5000, url = 'https://connectivitycheck.gstatic.com/generate_204' } = {}) {
  if (typeof fetch !== 'function') return { available: false, reason: 'fetch-unavailable' };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: 'GET', redirect: 'manual', signal: controller.signal });
    return { available: response.status === 204 || response.ok, status: response.status };
  } catch (error) {
    return { available: false, reason: error?.name === 'AbortError' ? 'timeout' : 'network-error' };
  } finally { clearTimeout(timer); }
}
