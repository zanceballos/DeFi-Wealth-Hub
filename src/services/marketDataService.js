// Lightweight market data fetcher for yfinance-defi API with simple in-memory cache

const DEFAULT_BASE = import.meta?.env?.VITE_MARKETDATA_BASE || 'https://yfinance-defi-api.stocksuite.app'

// cache: { [key: string]: { price: number, asOf: number, expiresAt: number } }
const cache = new Map()

function now() { return Date.now() }

function toKey(asset) {
  return String(asset || '').trim().toUpperCase()
}

export async function getYfPrice(asset, opts = {}) {
  const ttlMs = Number.isFinite(opts.ttlMs) ? opts.ttlMs : 5 * 60 * 1000 // 5 minutes default
  const key = toKey(asset)
  if (!key) return null

  const hit = cache.get(key)
  if (hit && hit.expiresAt > now()) {
    return hit.price
  }

  const url = `${DEFAULT_BASE}/price/${encodeURIComponent(key)}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json().catch(() => ({}))

    // Try common shapes: { price }, { data: { price } }, number
    let price = undefined
    if (typeof data === 'number') {
      price = data
    } else if (data && typeof data === 'object') {
      price = data.price ?? data?.data?.price ?? data?.c ?? data?.regularMarketPrice
    }

    const num = Number(price)
    if (!Number.isFinite(num) || num <= 0) return null

    cache.set(key, { price: num, asOf: now(), expiresAt: now() + ttlMs })
    return num
  } catch (e) {
    // swallow in prod; surface during dev
    if (import.meta?.env?.DEV) {
      console.warn('getYfPrice failed', { asset: key, error: e })
    }
    return null
  }
}

export function clearMarketCache() {
  cache.clear()
}
