// Cache utilities for API responses
const CACHE_PREFIX = "agroguard:v1:";

function cacheKey(url: string): string {
  try {
    return CACHE_PREFIX + btoa(url);
  } catch {
    return CACHE_PREFIX + url;
  }
}

interface CacheData {
  data: any;
  expiresAt: number;
}

export function cacheGet(url: string): any {
  try {
    const raw = localStorage.getItem(cacheKey(url));
    if (!raw) return null;
    
    const obj: CacheData = JSON.parse(raw);
    if (!obj.expiresAt) return obj.data;
    if (Date.now() < obj.expiresAt) return obj.data;
    
    return null;
  } catch {
    return null;
  }
}

export function cacheSet(url: string, data: any, ttlSec: number): void {
  try {
    const ttl = Math.max(0, Number(ttlSec) || 0);
    const payload: CacheData = {
      data,
      expiresAt: ttl ? (Date.now() + ttl * 1000) : 0
    };
    localStorage.setItem(cacheKey(url), JSON.stringify(payload));
  } catch {}
}

export async function fetchJSONWithCache(
  url: string,
  ttlSec: number,
  bust = false,
  fetchInit?: RequestInit
): Promise<{ json: any; fromCache: boolean }> {
  if (!bust) {
    const hit = cacheGet(url);
    if (hit) return { json: hit, fromCache: true };
  }
  
  const res = await fetch(url, fetchInit);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  
  const json = await res.json();
  if (ttlSec > 0) cacheSet(url, json, ttlSec);
  
  return { json, fromCache: false };
}