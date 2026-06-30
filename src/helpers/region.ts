// Supported browse markets — drives the country switcher on the home screen.
// Order matters: NG is the default (primary launch market), the rest are listed
// in rough launch sequence. Add a new country here once we have at least one
// car in that region and the backend supports the country filter param.

export type BrowseCountry = {
  code: string; // ISO 3166 alpha-2
  name: string;
  /** Currency to suggest when the user picks this country. */
  currency: string;
};

// Initial launch markets. Eventually this list will be served from the
// dashboard via /platform/supported-markets so admins can add/remove countries
// without an app release — the bundled list stays as a build-time fallback.
export const SUPPORTED_COUNTRIES: BrowseCountry[] = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'TG', name: 'Togo', currency: 'XOF' },
];

export const DEFAULT_COUNTRY = 'NG';

/** Convert an ISO-3166 alpha-2 country code to its flag emoji. */
export function flagForCountry(code?: string | null): string {
  if (!code || code.length !== 2) return '';
  const offset = 0x1f1e6 - 'A'.charCodeAt(0);
  return [...code.toUpperCase()]
    .map(c => String.fromCodePoint(c.charCodeAt(0) + offset))
    .join('');
}

export function findCountry(code?: string | null): BrowseCountry | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return SUPPORTED_COUNTRIES.find(c => c.code === upper);
}
