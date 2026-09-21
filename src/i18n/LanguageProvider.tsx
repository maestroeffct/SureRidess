import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import * as RNLocalize from 'react-native-localize';

import i18n, { AppLanguage, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './index';
import { getItem, setItem, StorageKeys } from '@/helpers/storage';

type LanguageContextValue = {
  language: AppLanguage;
  /** Persists immediately and switches every screen using useTranslation(). */
  setLanguage: (lang: AppLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
});

function isSupported(value: unknown): value is AppLanguage {
  return (
    typeof value === 'string' &&
    (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
  );
}

/** Best-effort guess from the device's own language settings — used only
 *  until the user makes an explicit choice (from then on their pick wins
 *  and this is never consulted again). Falls back to DEFAULT_LANGUAGE for
 *  anything we don't ship a translation for. */
function detectDeviceLanguage(): AppLanguage {
  try {
    const best = RNLocalize.findBestLanguageTag(
      SUPPORTED_LANGUAGES as unknown as string[],
    );
    if (best && isSupported(best.languageTag.split('-')[0])) {
      return best.languageTag.split('-')[0] as AppLanguage;
    }
    const [first] = RNLocalize.getLocales();
    if (first && isSupported(first.languageCode)) {
      return first.languageCode as AppLanguage;
    }
  } catch {
    // react-native-localize hitting a native-module issue shouldn't ever
    // block the app from rendering — just fall through to the default.
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  // Hydrate on launch: an explicit past choice always wins. Otherwise fall
  // back to the device's own language setting (e.g. a phone set to French
  // opens straight into French) rather than hardcoding English. i18next
  // itself starts on DEFAULT_LANGUAGE synchronously (see i18n/index.ts
  // init), so there's no flash of the wrong language either way — we just
  // re-point it once this resolves.
  useEffect(() => {
    getItem<AppLanguage>(StorageKeys.APP_LANGUAGE)
      .then(saved => {
        const resolved = isSupported(saved) ? saved : detectDeviceLanguage();
        setLanguageState(resolved);
        void i18n.changeLanguage(resolved);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    if (!isSupported(lang)) return;
    setLanguageState(lang);
    void i18n.changeLanguage(lang);
    setItem(StorageKeys.APP_LANGUAGE, lang).catch(() => {});
  }, []);

  // Don't render children until the persisted preference is loaded, so
  // screens never briefly flash in the wrong language on launch.
  if (!ready) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
