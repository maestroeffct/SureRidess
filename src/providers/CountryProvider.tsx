import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getItem, setItem, StorageKeys } from '@/helpers/storage';
import { DEFAULT_COUNTRY, findCountry } from '@/helpers/region';

type CountryContextValue = {
  /** ISO-3166 alpha-2 code of the country the user is browsing in. */
  country: string;
  ready: boolean;
  /** Manually change. Persists immediately. */
  setCountry: (code: string) => void;
};

const CountryContext = createContext<CountryContextValue>({
  country: DEFAULT_COUNTRY,
  ready: false,
  setCountry: () => {},
});

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<string>(DEFAULT_COUNTRY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getItem<string>(StorageKeys.BROWSE_COUNTRY)
      .then(saved => {
        if (saved && findCountry(saved)) {
          setCountryState(saved);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setCountry = useCallback((code: string) => {
    const upper = code.trim().toUpperCase();
    if (!upper || !findCountry(upper)) return;
    setCountryState(upper);
    setItem(StorageKeys.BROWSE_COUNTRY, upper).catch(() => {});
  }, []);

  return (
    <CountryContext.Provider value={{ country, ready, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useBrowseCountry() {
  return useContext(CountryContext);
}
