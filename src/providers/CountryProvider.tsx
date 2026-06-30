import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getItem, setItem, StorageKeys } from '@/helpers/storage';
import {
  BrowseCountry,
  DEFAULT_COUNTRY,
  SUPPORTED_COUNTRIES as BUNDLED_FALLBACK,
} from '@/helpers/region';
import {
  fetchSupportedMarkets,
  refreshSupportedMarkets,
} from '@/services/markets.service';

type CountryContextValue = {
  /** ISO-3166 alpha-2 code of the country the user is browsing in. */
  country: string;
  /** Live list of supported markets — driven by the admin dashboard. */
  markets: BrowseCountry[];
  ready: boolean;
  /** Manually change. Persists immediately. Only succeeds if the code is in
   *  the live `markets` list. */
  setCountry: (code: string) => void;
  /**
   * Force-fetch the markets list, bypassing the cache. Call this when the
   * user opens the picker so admin-side changes propagate instantly. No-op
   * on failure; existing markets remain.
   */
  refreshMarkets: () => Promise<void>;
};

const CountryContext = createContext<CountryContextValue>({
  country: DEFAULT_COUNTRY,
  markets: BUNDLED_FALLBACK,
  ready: false,
  setCountry: () => {},
  refreshMarkets: async () => {},
});

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string>(DEFAULT_COUNTRY);
  const [markets, setMarkets] = useState<BrowseCountry[]>(BUNDLED_FALLBACK);
  const [ready, setReady] = useState(false);

  // Hydrate persisted selection + refresh markets from backend on launch. If
  // the admin disables the user's chosen country, snap them to the first one
  // that's still available — better than showing an unselectable flag.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const [saved, liveMarkets] = await Promise.all([
        getItem<string>(StorageKeys.BROWSE_COUNTRY).catch(() => null),
        fetchSupportedMarkets(),
      ]);
      if (cancelled) return;

      setMarkets(liveMarkets);

      const find = (code?: string | null) =>
        code ? liveMarkets.find(m => m.code === code.toUpperCase()) : undefined;

      const target =
        find(saved) ?? find(DEFAULT_COUNTRY) ?? liveMarkets[0] ?? null;
      if (target) {
        setCountryState(target.code);
        if (saved !== target.code) {
          setItem(StorageKeys.BROWSE_COUNTRY, target.code).catch(() => {});
        }
      }
      setReady(true);
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCountry = useCallback(
    (code: string) => {
      const upper = code.trim().toUpperCase();
      if (!upper) return;
      const found = markets.find(m => m.code === upper);
      if (!found) return;
      setCountryState(upper);
      setItem(StorageKeys.BROWSE_COUNTRY, upper).catch(() => {});
    },
    [markets],
  );

  const refreshMarkets = useCallback(async () => {
    const fresh = await refreshSupportedMarkets();
    if (!fresh) return;
    setMarkets(fresh);
    // If the user's selected country was removed by an admin, snap them to the
    // first available one. Don't fight an active user choice if it's still
    // valid.
    if (!fresh.some(m => m.code === country)) {
      const fallback = fresh[0];
      if (fallback) {
        setCountryState(fallback.code);
        setItem(StorageKeys.BROWSE_COUNTRY, fallback.code).catch(() => {});
      }
    }
  }, [country]);

  const value = useMemo(
    () => ({ country, markets, ready, setCountry, refreshMarkets }),
    [country, markets, ready, setCountry, refreshMarkets],
  );

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export function useBrowseCountry() {
  return useContext(CountryContext);
}
