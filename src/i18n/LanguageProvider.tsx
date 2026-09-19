import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

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

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [ready, setReady] = useState(false);

  // Hydrate persisted choice on launch. i18next itself starts on
  // DEFAULT_LANGUAGE synchronously (see i18n/index.ts init), so there's no
  // flash of the wrong language — we just re-point it once storage resolves.
  useEffect(() => {
    getItem<AppLanguage>(StorageKeys.APP_LANGUAGE)
      .then(saved => {
        if (isSupported(saved)) {
          setLanguageState(saved);
          void i18n.changeLanguage(saved);
        }
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
