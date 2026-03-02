type CountriesNowResponse<T> = {
  error: boolean;
  msg: string;
  data: T;
};

type CountryStatesData = {
  name: string;
  iso3?: string;
  states: Array<{ name: string; state_code?: string }>;
};

async function postCountriesNow<T>(
  endpoint: string,
  payload: Record<string, string>,
): Promise<T> {
  const response = await fetch(`https://countriesnow.space/api/v0.1${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Countries API request failed: ${response.status}`);
  }

  const json = (await response.json()) as CountriesNowResponse<T>;

  if (json.error) {
    throw new Error(json.msg || 'Countries API returned an error');
  }

  return json.data;
}

export async function fetchStatesByCountry(country: string): Promise<string[]> {
  if (!country) return [];

  const data = await postCountriesNow<CountryStatesData>('/countries/states', {
    country,
  });

  const states = (data?.states || [])
    .map(item => item?.name?.trim())
    .filter(Boolean) as string[];

  return Array.from(new Set(states)).sort((a, b) => a.localeCompare(b));
}

export async function fetchRegionsByState(
  country: string,
  state: string,
): Promise<string[]> {
  if (!country || !state) return [];

  const data = await postCountriesNow<string[]>('/countries/state/cities', {
    country,
    state,
  });

  const regions = (data || []).map(item => item?.trim()).filter(Boolean) as string[];

  return Array.from(new Set(regions)).sort((a, b) => a.localeCompare(b));
}
