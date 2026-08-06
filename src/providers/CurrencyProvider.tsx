import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { getItem, setItem, StorageKeys } from '@/helpers/storage';
import { convertMoney, currencyForCountry, formatMoney } from '@/helpers/currency';
import { hydrateFxRates } from '@/services/fxRates.service';

type CurrencyContextValue = {
  /** User's chosen display currency (3-letter ISO code, e.g. NGN, USD). */
  currency: string;
  /** True until the persisted preference has been loaded from storage. */
  ready: boolean;
  /** Manually change the currency. Persists immediately. */
  setCurrency: (code: string) => void;
  /**
   * Set the default from the user's country, but only if the user has not
   * already chosen a currency explicitly. Safe to call repeatedly.
   */
  setDefaultFromCountry: (country?: string | null) => void;
};

const DEFAULT_CURRENCY = 'NGN';

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  ready: false,
  setCurrency: () => {},
  setDefaultFromCountry: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);
  const [ready, setReady] = useState(false);
  // Tracks whether the current value came from a user choice or a default.
  // Defaults can be overwritten by setDefaultFromCountry; user choices cannot.
  const [userChosen, setUserChosen] = useState(false);

  useEffect(() => {
    getItem<string>(StorageKeys.DISPLAY_CURRENCY)
      .then(saved => {
        if (saved) {
          setCurrencyState(saved);
          setUserChosen(true);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));

    // Warm the live FX rate cache so any convertMoney() / fmtMoney() call has
    // real rates to work with. Fire-and-forget — failure falls back to the
    // bundled mock rates and the UI keeps rendering.
    void hydrateFxRates();
  }, []);

  const setCurrency = useCallback((code: string) => {
    const upper = code.trim().toUpperCase();
    if (!upper) return;
    setCurrencyState(upper);
    setUserChosen(true);
    setItem(StorageKeys.DISPLAY_CURRENCY, upper).catch(() => {});
  }, []);

  const setDefaultFromCountry = useCallback(
    (country?: string | null) => {
      if (userChosen) return;
      const derived = currencyForCountry(country);
      if (!derived) return;
      setCurrencyState(derived);
      // Persist so subsequent launches don't re-derive (cheap consistency).
      setItem(StorageKeys.DISPLAY_CURRENCY, derived).catch(() => {});
    },
    [userChosen],
  );

  return (
    <CurrencyContext.Provider
      value={{ currency, ready, setCurrency, setDefaultFromCountry }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

/**
 * Returns a money formatter that converts amounts from a source currency
 * (the backend's) to the user's chosen display currency, then formats.
 *
 * Usage:
 *   const fmt = useFormatMoney();
 *   fmt(35000, 'NGN');                       // → $23 if user picked USD
 *   fmt(35000, 'NGN', { round: true });
 *   fmt(35000, 'NGN', { strict: true });     // → ₦35,000 (no conversion)
 */
export function useFormatMoney() {
  const { currency: userCurrency } = useCurrency();
  return (
    amount?: number | null,
    sourceCurrency?: string | null,
    opts: { round?: boolean; strict?: boolean } = {},
  ) => {
    if (amount == null || !Number.isFinite(amount)) return '—';
    if (opts.strict) {
      return formatMoney(amount, sourceCurrency, { round: opts.round });
    }
    const target = userCurrency || sourceCurrency;
    const converted = convertMoney(amount, sourceCurrency, target);
    return formatMoney(converted, target, { round: opts.round });
  };
}
