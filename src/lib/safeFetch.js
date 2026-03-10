export async function safeFetchJson(url, { timeout = 20000, ...options } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const msg = text?.trim() ? text.trim() : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error("Invalid JSON response from server");
    }
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Server may be unreachable.');
    }
    if (err instanceof TypeError) {
      throw new Error('Network error. Is the server running?');
    }
    throw err;
  } finally {
    clearTimeout(id);
  }
}
