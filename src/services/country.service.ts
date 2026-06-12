import { RESTCOUNTRIES_API_KEY } from '@env';

import { BUNDLED_COUNTRIES } from '@/data/countries';
import { getItem, setItem, StorageKeys } from '@/helpers/storage';

export type Country = {
  name: string;
  callingCode: string;
  code: string; // ISO alpha-2 code e.g. NG, US
};

// Strategy:
//  1. If we have a cached list from a previous successful fetch, use it.
//  2. Otherwise, try restcountries v5 with the API key.
//  3. On any failure (no key, network, rate limit, parse error), fall back to
//     the bundled static list so the country picker always works.
//
// v5 endpoint: GET https://api.restcountries.com/countries/v5
//   - Bearer token authentication
//   - Paginated (limit/offset; default 25, max 100)
//   - response_fields acts as an allowlist of properties on each item
//
// Source: https://restcountries.com/docs

const V5_BASE_URL = 'https://api.restcountries.com/countries/v5';
const V5_PAGE_SIZE = 100;
const V5_TIMEOUT_MS = 8000;

type V5Country = {
  names?: { common?: string };
  codes?: { alpha_2?: string };
  calling_codes?: string[];
};

type V5Response = {
  data?: V5Country[];
  // The docs use either `total` or `total_count`; we tolerate both.
  total?: number;
  total_count?: number;
};

async function fetchFromV5(apiKey: string): Promise<Country[]> {
  const collected: V5Country[] = [];
  let offset = 0;

  // Loop until we've pulled every page. The page count is bounded (~250
  // countries / 100 per page = 3 pages) so we cap iterations defensively.
  for (let i = 0; i < 5; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), V5_TIMEOUT_MS);

    let json: V5Response;
    try {
      const response = await fetch(
        `${V5_BASE_URL}?limit=${V5_PAGE_SIZE}&offset=${offset}` +
          '&response_fields=names.common,calling_codes,codes.alpha_2',
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: controller.signal,
        },
      );
      clearTimeout(timeout);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      json = (await response.json()) as V5Response;
    } finally {
      clearTimeout(timeout);
    }

    const page = json.data ?? [];
    if (page.length === 0) break;
    collected.push(...page);

    const total = json.total ?? json.total_count;
    if (total && collected.length >= total) break;
    if (page.length < V5_PAGE_SIZE) break;

    offset += page.length;
  }

  const mapped: Country[] = collected
    .map(c => {
      const name = c.names?.common;
      const callingCode = c.calling_codes?.[0];
      const code = c.codes?.alpha_2;
      if (!name || !callingCode || !code) return null;
      // Ensure the calling code has a leading "+" — v5 sometimes returns "234",
      // sometimes "+234"; the picker UI expects the prefix.
      const normalised = callingCode.startsWith('+')
        ? callingCode
        : `+${callingCode}`;
      return { name, callingCode: normalised, code };
    })
    .filter((c): c is Country => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (mapped.length === 0) {
    throw new Error('v5 returned no usable countries');
  }
  return mapped;
}

export async function fetchCountries(): Promise<Country[]> {
  // 1. Cached result from a previous successful fetch
  const cached = await getItem<Country[]>(StorageKeys.COUNTRIES);
  if (cached && cached.length > 0 && cached[0]?.code) {
    return cached;
  }

  // 2. Live v5 fetch if we have a key
  const apiKey = RESTCOUNTRIES_API_KEY?.trim();
  if (apiKey) {
    try {
      const live = await fetchFromV5(apiKey);
      await setItem(StorageKeys.COUNTRIES, live);
      return live;
    } catch (err) {
      console.warn('[countries] v5 fetch failed, using bundled list', err);
    }
  }

  // 3. Bundled fallback — always works, no network needed
  return BUNDLED_COUNTRIES;
}
