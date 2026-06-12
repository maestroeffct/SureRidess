const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
  CAD: 'C$',
  AUD: 'A$',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  AED: 'AED ',
  SAR: 'SAR ',
};

// ISO 3166 country code → ISO 4217 currency code.
// Covers the countries we actively serve; extend as needed.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  NG: 'NGN',
  US: 'USD',
  GB: 'GBP',
  CA: 'CAD',
  AU: 'AUD',
  GH: 'GHS',
  KE: 'KES',
  ZA: 'ZAR',
  DE: 'EUR',
  FR: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  IN: 'INR',
  AE: 'AED',
  SA: 'SAR',
};

// Country name fallback for when we only have the human name (e.g. "Nigeria").
const COUNTRY_NAME_TO_CURRENCY: Record<string, string> = {
  nigeria: 'NGN',
  'united states': 'USD',
  'united states of america': 'USD',
  usa: 'USD',
  'united kingdom': 'GBP',
  uk: 'GBP',
  britain: 'GBP',
  canada: 'CAD',
  australia: 'AUD',
  ghana: 'GHS',
  kenya: 'KES',
  'south africa': 'ZAR',
  germany: 'EUR',
  france: 'EUR',
  spain: 'EUR',
  italy: 'EUR',
  netherlands: 'EUR',
  ireland: 'EUR',
  japan: 'JPY',
  china: 'CNY',
  india: 'INR',
  'united arab emirates': 'AED',
  uae: 'AED',
  'saudi arabia': 'SAR',
};

export const SUPPORTED_CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'EUR', name: 'Euro' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'ZAR', name: 'South African Rand' },
];

// ── FX rates ────────────────────────────────────────────────────────────────
// All rates expressed as "1 USD = X target". So 1 USD = 1500 NGN.
// IMPORTANT: these are static placeholder rates for display purposes ONLY.
// The actual amount charged at Stripe checkout is in the provider's currency
// (the backend doesn't yet support FX). When the backend implements FX per
// docs/backend-multi-currency.md, set MOCK_FX = false and the backend's
// already-converted amounts will be used as-is.
export const MOCK_FX = true;

const FX_RATES_FROM_USD: Record<string, number> = {
  USD: 1,
  NGN: 1500,
  GBP: 0.79,
  EUR: 0.93,
  CAD: 1.35,
  AUD: 1.52,
  GHS: 15.2,
  KES: 128,
  ZAR: 18.5,
};

export function convertMoney(
  amount: number,
  fromCurrency?: string | null,
  toCurrency?: string | null,
): number {
  if (!MOCK_FX) return amount;
  if (!fromCurrency || !toCurrency) return amount;
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return amount;
  const fromRate = FX_RATES_FROM_USD[from];
  const toRate = FX_RATES_FROM_USD[to];
  if (!fromRate || !toRate) return amount; // unknown currency, don't convert
  return (amount / fromRate) * toRate;
}

export function currencyForCountry(country?: string | null): string | undefined {
  if (!country) return undefined;
  const trimmed = country.trim();
  if (!trimmed) return undefined;
  // 2-letter ISO code
  if (trimmed.length === 2) {
    return COUNTRY_TO_CURRENCY[trimmed.toUpperCase()];
  }
  // Fall back to human name lookup
  return COUNTRY_NAME_TO_CURRENCY[trimmed.toLowerCase()];
}

export type CurrencyCode = string;

export function symbolFor(currency?: CurrencyCode | null): string {
  if (!currency) return '₦';
  const upper = currency.toUpperCase();
  return CURRENCY_SYMBOLS[upper] ?? upper + ' ';
}

export function formatMoney(
  amount?: number | null,
  currency?: CurrencyCode | null,
  options: { fallback?: string; round?: boolean } = {},
): string {
  const { fallback = '—', round = false } = options;
  if (typeof amount !== 'number' || !Number.isFinite(amount)) return fallback;
  const value = round ? Math.round(amount) : amount;
  return `${symbolFor(currency)}${value.toLocaleString()}`;
}
