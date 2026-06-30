import { api } from './api';
import { getItem, setItem, StorageKeys } from '@/helpers/storage';
import {
  SUPPORTED_COUNTRIES as BUNDLED_FALLBACK,
  type BrowseCountry,
} from '@/helpers/region';

// Markets are the launch-region list served by the admin dashboard. We fetch
// once per launch, cache to AsyncStorage so subsequent reads are instant, and
// always fall back to the bundled list if the network call fails — the
// country picker must NEVER be empty even on a fresh install with no signal.

type MarketsResponse = {
  items: Array<{
    code: string;
    name: string;
    currency: string;
  }>;
};

type CachedMarkets = {
  items: BrowseCountry[];
  fetchedAt: string;
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — markets change rarely

function normalize(items: MarketsResponse['items']): BrowseCountry[] {
  return items
    .filter(item => item.code && item.currency)
    .map(item => ({
      code: item.code.toUpperCase(),
      name: item.name,
      currency: item.currency.toUpperCase(),
    }));
}

/**
 * Returns the current supported markets. Reads from cache if fresh, otherwise
 * refreshes from `/platform/markets`. Always resolves — falls back to the
 * bundled list on any failure.
 */
export async function fetchSupportedMarkets(): Promise<BrowseCountry[]> {
  try {
    const cached = await getItem<CachedMarkets>(StorageKeys.SUPPORTED_MARKETS);
    if (cached?.items?.length) {
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) return cached.items;
    }
  } catch {
    // ignore — fall through to network
  }

  try {
    const { data } = await api.get<MarketsResponse>('/platform/markets');
    const items = normalize(data.items ?? []);
    if (items.length > 0) {
      await setItem<CachedMarkets>(StorageKeys.SUPPORTED_MARKETS, {
        items,
        fetchedAt: new Date().toISOString(),
      });
      return items;
    }
  } catch (err) {
    console.warn('[markets] fetch failed, using bundled list', err);
  }

  return BUNDLED_FALLBACK;
}

/** Returns the latest cached markets WITHOUT touching the network. */
export async function getCachedMarkets(): Promise<BrowseCountry[] | null> {
  try {
    const cached = await getItem<CachedMarkets>(StorageKeys.SUPPORTED_MARKETS);
    return cached?.items?.length ? cached.items : null;
  } catch {
    return null;
  }
}

/**
 * Force-fetches `/platform/markets`, bypassing the cache TTL. Used when the
 * user opens the picker so an admin-side change propagates without waiting
 * for the cache to expire. Returns null on any failure so callers can keep
 * showing whatever they already had.
 */
export async function refreshSupportedMarkets(): Promise<BrowseCountry[] | null> {
  try {
    const { data } = await api.get<MarketsResponse>('/platform/markets');
    const items = normalize(data.items ?? []);
    if (items.length === 0) return null;
    await setItem<CachedMarkets>(StorageKeys.SUPPORTED_MARKETS, {
      items,
      fetchedAt: new Date().toISOString(),
    });
    return items;
  } catch (err) {
    console.warn('[markets] refresh failed', err);
    return null;
  }
}
