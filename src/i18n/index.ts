import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enOnboarding from './locales/en/onboarding.json';
import enKyc from './locales/en/kyc.json';
import enCarRental from './locales/en/carRental.json';
import enMain from './locales/en/main.json';

import frCommon from './locales/fr/common.json';
import frAuth from './locales/fr/auth.json';
import frOnboarding from './locales/fr/onboarding.json';
import frKyc from './locales/fr/kyc.json';
import frCarRental from './locales/fr/carRental.json';
import frMain from './locales/fr/main.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = 'en';

// One namespace per feature area — keeps translation files small and lets
// each module's screens be converted/reviewed independently. defaultNS
// ('common') is for generic strings shared across screens (buttons like
// Cancel/Save/Retry, generic error messages).
export const NAMESPACES = [
  'common',
  'auth',
  'onboarding',
  'kyc',
  'carRental',
  'main',
] as const;

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      onboarding: enOnboarding,
      kyc: enKyc,
      carRental: enCarRental,
      main: enMain,
    },
    fr: {
      common: frCommon,
      auth: frAuth,
      onboarding: frOnboarding,
      kyc: frKyc,
      carRental: frCarRental,
      main: frMain,
    },
  },
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  ns: NAMESPACES as unknown as string[],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes — avoid double-escaping.
  },
  react: {
    useSuspense: false, // Suspense isn't wired up; resolve synchronously.
  },
});

export default i18n;
