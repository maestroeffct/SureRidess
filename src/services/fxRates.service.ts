import { api } from './api';
import { getItem, setItem, StorageKeys } from '@/helpers/storage';
import { setLiveFxRatesFromUsd } from '@/helpers/currency';

// USD-based FX rates used by the mobile to convert any currency pair locally.
// They're refreshed from `/platform/fx-rates` once per session (or on a 1h
// timer) and fall back to the bundled MOCK_FX_RATES_FROM_USD constant in
// helpers/currency.ts when the network is down.
//
// IMPORTANT: this is for DISPLAY ONLY. The actual amount charged at checkout
// is the rate the backend persisted into `FxQuote` at booking time — not this
// one. Browse-time rates are for UX (showing "₦25,000 ≈ $16 / CFA 10,440").

type FxRatesResponse = {
  base: 'USD';
  fetchedAt: string;
  rates: Record<string, number>;
};

type CachedRates = {
  rates: Record<string, number>;
  fetchedAt: string;
};

// 1h — short enough that rates aren't stale for a returning user, long enough
// that we don't re-hit the network on every cold launch.
const CACHE_TTL_MS = 60 * 60 * 1000;

async function persistAndApply(rates: Record<string, number>) {
  setLiveFxRatesFromUsd(rates);
  await setItem<CachedRates>(StorageKeys.FX_RATES, {
    rates,
    fetchedAt: new Date().toISOString(),
  }).catch(() => {});
}

/**
 * Hydrates the mobile FX cache. Reads from AsyncStorage first so converters
 * have something to work with immediately, then refreshes from the network in
 * the background. Always resolves — failures are silent and fall back to the
 * bundled MOCK rates.
 */
export async function hydrateFxRates(): Promise<void> {
  // 1. Warm from cache so listing prices render correctly on next paint.
  try {
    const cached = await getItem<CachedRates>(StorageKeys.FX_RATES);
    if (cached?.rates) {
      setLiveFxRatesFromUsd(cached.rates);
      const age = Date.now() - new Date(cached.fetchedAt).getTime();
      if (age < CACHE_TTL_MS) return; // still fresh, no refresh needed
    }
  } catch {
    // ignore — proceed to network
  }

  // 2. Refresh from network — non-blocking for the caller's hot path.
  try {
    const { data } = await api.get<FxRatesResponse>('/platform/fx-rates');
    if (data?.rates && Object.keys(data.rates).length > 0) {
      await persistAndApply(data.rates);
    }
  } catch (err) {
    console.warn('[fx-rates] refresh failed, using cached or bundled', err);
  }
}
