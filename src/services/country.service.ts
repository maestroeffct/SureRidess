import { getItem, setItem, StorageKeys } from '@/helpers/storage';

export type Country = {
  name: string;
  callingCode: string;
  code: string; // ISO code e.g. NG, US
};

export async function fetchCountries(): Promise<Country[]> {
  // 1️⃣ Check cache first
  const cached = await getItem<Country[]>(StorageKeys.COUNTRIES);
  if (cached && cached.length > 0) {
    return cached;
  }

  // 2️⃣ Fetch from API
  const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd');

  if (!res.ok) {
    throw new Error('Failed to fetch countries');
  }

  const data = await res.json();

  const countries: Country[] = data
    .map((c: any) => {
      const root = c.idd?.root;
      const suffix = c.idd?.suffixes?.[0];

      if (!root || !suffix) return null;

      return {
        name: c.name.common,
        callingCode: `${root}${suffix}`,
        code: c.cca2,
      };
    })
    .filter(Boolean)
    .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

  // 3️⃣ Save to cache
  await setItem(StorageKeys.COUNTRIES, countries);

  return countries;
}
