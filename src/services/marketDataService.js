// Lightweight Alpha Vantage market data helper with basic caching and rate limiting

const cache = new Map() // key: ticker, value: { price: number, at: number }

const ONE_MINUTE = 60 * 1000

function getApiKey() {
  // Vite exposes env vars under import.meta.env
  return (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_ALPHAVANTAGE_KEY || import.meta.env.VITE_ALPHA_VANTAGE_KEY))
}

export async function getStockPrice(ticker, { ttlMs = ONE_MINUTE } = {}) {
  const symbol = String(ticker || '').trim().toUpperCase()
  if (!symbol) return null

  const now = Date.now()
  const hit = cache.get(symbol)
  if (hit && now - hit.at < ttlMs) {
    return hit.price
  }

  const API_KEY = getApiKey()
  if (!API_KEY) {
    // In dev, warn once per symbol per minute
    if (!hit) console.warn('[marketDataService] Missing VITE_ALPHAVANTAGE_KEY; skipping live price for', symbol)
    return hit?.price ?? null
  }

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`
  try {
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = await resp.json()
    const quote = data?.['Global Quote'] || data?.GlobalQuote || {}
    const rawPrice = quote['05. price'] || quote['05.price'] || quote.price
    const price = rawPrice != null ? Number(rawPrice) : null
    if (Number.isFinite(price)) {
      cache.set(symbol, { price, at: now })
      return price
    }
    return null
  } catch (e) {
    if (import.meta?.env?.MODE !== 'production') {
      console.warn('[marketDataService] Failed to fetch price for', symbol, e)
    }
    return hit?.price ?? null
  }
}

// Simple round-robin iterator over symbols to respect Alpha Vantage 5 req/min rate limit
export function makeSymbolRotator(symbols) {
  const list = Array.from(new Set((symbols || []).map(s => String(s || '').trim().toUpperCase()).filter(Boolean)))
  let idx = 0
  return function next() {
    if (list.length === 0) return null
    const s = list[idx]
    idx = (idx + 1) % list.length
    return s
  }
}
