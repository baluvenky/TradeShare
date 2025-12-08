/**
 * Simple in-memory cache for NSE option expiry dates per symbol.
 * Uses the NSE option-chain API: /api/option-chain-indices?symbol=<SYMBOL>
 */

const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

type CacheEntry = {
  expiryDates: string[];
  ts: number;
};

const cache = new Map<string, CacheEntry>();
const refreshTimers = new Map<string, NodeJS.Timeout>();

async function fetchExpiryDatesFromNSE(symbol: string): Promise<string[] | null> {
  try {
    const url = `https://www.nseindia.com/api/option-chain-indices?symbol=${encodeURIComponent(symbol)}`;
    // Prefer global fetch where available (Node 18+).
    let res: any = null;
    const gf = (globalThis as any).fetch;
    if (typeof gf === 'function') {
      res = await gf(url, { method: 'GET' } as any);
    } else {
      // Fallback: use built-in https to fetch JSON (no external deps)
      res = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        try {
          // lazy require https to keep compatibility with browser-like runtimes
          const https = require('https');
          const opts = new URL(url);
          const req = https.request({ hostname: opts.hostname, path: opts.pathname + opts.search, method: 'GET', headers: { 'User-Agent': 'node.js' } }, (r: any) => {
            let body = '';
            r.setEncoding('utf8');
            r.on('data', (chunk: string) => body += chunk);
            r.on('end', () => resolve({ status: r.statusCode || 0, body }));
          });
          req.on('error', reject);
          req.end();
        } catch (e) {
          reject(e);
        }
      });
    }

    let data: any = null;
    if (res) {
      if (typeof (res.json) === 'function') {
        data = await res.json();
      } else if (typeof res.body === 'string') {
        try {
          data = JSON.parse(res.body);
        } catch (e) {
          data = null;
        }
      }
    }
    if (data && data.records && Array.isArray(data.records.expiryDates)) {
      return data.records.expiryDates as string[];
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch expiry dates directly from NSE API without touching the cache.
 * Useful for per-request fresh data when caller does not want cached values.
 */
export async function fetchExpiryDatesNow(symbol: string): Promise<string[] | null> {
  return await fetchExpiryDatesFromNSE(symbol);
}

export async function refreshExpiryDates(symbol: string): Promise<void> {
  const dates = await fetchExpiryDatesFromNSE(symbol);
  if (dates && dates.length > 0) {
    cache.set(symbol, { expiryDates: dates, ts: Date.now() });
  }
}

/**
 * Start automatic periodic refresh for the given symbols.
 * Returns a map of timers created.
 */
export function startAutoRefresh(symbols: string[], intervalMs: number = 1000 * 60 * 5) {
  symbols.forEach((s) => {
    const key = s.toUpperCase();
    // avoid duplicate timers
    if (refreshTimers.has(key)) return;
    // immediate refresh then schedule
    void refreshExpiryDates(key).catch(() => {});
    const t = setInterval(() => {
      void refreshExpiryDates(key).catch(() => {});
    }, intervalMs);
    refreshTimers.set(key, t);
  });
}

/**
 * Stop automatic refresh for the provided symbols (or all if none provided)
 */
export function stopAutoRefresh(symbols?: string[]) {
  if (!symbols) {
    // clear all
    for (const [, t] of refreshTimers) clearInterval(t as any);
    refreshTimers.clear();
    return;
  }
  symbols.forEach((s) => {
    const key = s.toUpperCase();
    const t = refreshTimers.get(key);
    if (t) {
      clearInterval(t as any);
      refreshTimers.delete(key);
    }
  });
}

export function getCachedExpiryDates(symbol: string): string[] | undefined {
  const entry = cache.get(symbol);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(symbol);
    return undefined;
  }
  return entry.expiryDates;
}

export function clearCache(): void {
  cache.clear();
}

export function setCachedExpiryDates(symbol: string, dates: string[]): void {
  cache.set(symbol, { expiryDates: dates, ts: Date.now() });
}

export default {
  refreshExpiryDates,
  getCachedExpiryDates,
  clearCache,
  setCachedExpiryDates,
  startAutoRefresh,
  stopAutoRefresh,
};
