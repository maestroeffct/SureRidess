# Dashboard: Multi-region Tax & Currency

This spec covers the admin dashboard changes needed to support the multi-tier tax model described in [backend-multi-currency.md](./backend-multi-currency.md).

The dashboard already supports country-scoped settings via `AdminCountryScopeBar`. This doc describes adding a second tier (region/state) for countries that need it, plus seeding common rates and a few small currency-display fixes.

---

## 1. Goal

An admin should be able to:

1. Pick **United States** in the country scope bar.
2. See a second dropdown appear: **All US** / **California** / **New York** / ...
3. Pick **California**, navigate to Business Settings → System Tax, and add a "California Sales Tax" row at 7.25%.
4. Switch to **New York**, add NY's 8.875% row independently.
5. Switch back to **GLOBAL** to see and edit country-wide rules (UK VAT, NG VAT, etc.).

For countries with no sub-region tax (Nigeria, UK, Germany), the region dropdown is hidden or shows only "All".

---

## 2. Files to touch

| File | Purpose | Change |
|---|---|---|
| [`src/lib/adminCountryScope.ts`](../../sureride-dashboard/src/lib/adminCountryScope.ts) | Country scope storage | Extend to also store region |
| [`src/lib/adminRegions.ts`](../../sureride-dashboard/src/lib/) (new) | Region catalog | Static map of countries → regions |
| [`src/components/rentals/common/AdminCountryScopeBar.tsx`](../../sureride-dashboard/src/components/rentals/common/) | Scope picker UI | Add region dropdown |
| [`src/lib/platformSettingsDraftApi.ts`](../../sureride-dashboard/src/lib/platformSettingsDraftApi.ts) | Tax rule API client | Add `region` to load/save calls |
| [`src/components/rentals/business/BusinessSettingsFeaturePage.tsx`](../../sureride-dashboard/src/components/rentals/business/BusinessSettingsFeaturePage.tsx) | System Tax UI | Consume `selectedRegionId` + show region in saved rule context |
| [`app/(protected)/rentals/pricing-rules/page.tsx`](../../sureride-dashboard/app/(protected)/rentals/pricing-rules/page.tsx) | Pricing rules display | Replace hardcoded `"NGN"` in `fmtMoney` with currency from scope |

---

## 3. Region catalog

New file: `src/lib/adminRegions.ts`

```ts
export const GLOBAL_REGION_SCOPE = "ALL";

type Region = { code: string; label: string };

export const REGIONS_BY_COUNTRY: Record<string, Region[]> = {
  US: [
    { code: "AL", label: "Alabama" },
    { code: "AK", label: "Alaska" },
    { code: "AZ", label: "Arizona" },
    { code: "AR", label: "Arkansas" },
    { code: "CA", label: "California" },
    { code: "CO", label: "Colorado" },
    { code: "CT", label: "Connecticut" },
    { code: "DE", label: "Delaware" },
    { code: "DC", label: "District of Columbia" },
    { code: "FL", label: "Florida" },
    { code: "GA", label: "Georgia" },
    { code: "HI", label: "Hawaii" },
    { code: "ID", label: "Idaho" },
    { code: "IL", label: "Illinois" },
    { code: "IN", label: "Indiana" },
    { code: "IA", label: "Iowa" },
    { code: "KS", label: "Kansas" },
    { code: "KY", label: "Kentucky" },
    { code: "LA", label: "Louisiana" },
    { code: "ME", label: "Maine" },
    { code: "MD", label: "Maryland" },
    { code: "MA", label: "Massachusetts" },
    { code: "MI", label: "Michigan" },
    { code: "MN", label: "Minnesota" },
    { code: "MS", label: "Mississippi" },
    { code: "MO", label: "Missouri" },
    { code: "MT", label: "Montana" },
    { code: "NE", label: "Nebraska" },
    { code: "NV", label: "Nevada" },
    { code: "NH", label: "New Hampshire" },
    { code: "NJ", label: "New Jersey" },
    { code: "NM", label: "New Mexico" },
    { code: "NY", label: "New York" },
    { code: "NC", label: "North Carolina" },
    { code: "ND", label: "North Dakota" },
    { code: "OH", label: "Ohio" },
    { code: "OK", label: "Oklahoma" },
    { code: "OR", label: "Oregon" },
    { code: "PA", label: "Pennsylvania" },
    { code: "RI", label: "Rhode Island" },
    { code: "SC", label: "South Carolina" },
    { code: "SD", label: "South Dakota" },
    { code: "TN", label: "Tennessee" },
    { code: "TX", label: "Texas" },
    { code: "UT", label: "Utah" },
    { code: "VT", label: "Vermont" },
    { code: "VA", label: "Virginia" },
    { code: "WA", label: "Washington" },
    { code: "WV", label: "West Virginia" },
    { code: "WI", label: "Wisconsin" },
    { code: "WY", label: "Wyoming" },
  ],
  CA: [
    { code: "AB", label: "Alberta" },
    { code: "BC", label: "British Columbia" },
    { code: "MB", label: "Manitoba" },
    { code: "NB", label: "New Brunswick" },
    { code: "NL", label: "Newfoundland and Labrador" },
    { code: "NS", label: "Nova Scotia" },
    { code: "ON", label: "Ontario" },
    { code: "PE", label: "Prince Edward Island" },
    { code: "QC", label: "Quebec" },
    { code: "SK", label: "Saskatchewan" },
    { code: "NT", label: "Northwest Territories" },
    { code: "NU", label: "Nunavut" },
    { code: "YT", label: "Yukon" },
  ],
  AU: [
    { code: "NSW", label: "New South Wales" },
    { code: "VIC", label: "Victoria" },
    { code: "QLD", label: "Queensland" },
    { code: "WA",  label: "Western Australia" },
    { code: "SA",  label: "South Australia" },
    { code: "TAS", label: "Tasmania" },
    { code: "ACT", label: "Australian Capital Territory" },
    { code: "NT",  label: "Northern Territory" },
  ],
};

export function countryHasRegions(country: string | null | undefined): boolean {
  if (!country) return false;
  return REGIONS_BY_COUNTRY[country.toUpperCase()]?.length > 0;
}

export function regionsFor(country: string | null | undefined): Region[] {
  if (!country) return [];
  return REGIONS_BY_COUNTRY[country.toUpperCase()] ?? [];
}
```

Countries not listed (NG, GB, FR, DE, …) only have country-wide tax rules — the region picker stays hidden.

---

## 4. Scope storage extension

Edit `src/lib/adminCountryScope.ts`:

```ts
export const GLOBAL_COUNTRY_SCOPE = "GLOBAL";
export const GLOBAL_REGION_SCOPE = "ALL";

const COUNTRY_KEY = "sureride_admin_country_scope_v1";
const REGION_KEY = "sureride_admin_region_scope_v1";

// ── country (existing) ─────────────────────────────────────
export function readAdminCountryScope() {
  if (typeof window === "undefined") return GLOBAL_COUNTRY_SCOPE;
  return window.localStorage.getItem(COUNTRY_KEY)?.trim() || GLOBAL_COUNTRY_SCOPE;
}

export function writeAdminCountryScope(scope: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COUNTRY_KEY, scope || GLOBAL_COUNTRY_SCOPE);
  // Reset region whenever country changes — they're stale.
  window.localStorage.removeItem(REGION_KEY);
}

// ── region (new) ───────────────────────────────────────────
export function readAdminRegionScope() {
  if (typeof window === "undefined") return GLOBAL_REGION_SCOPE;
  return window.localStorage.getItem(REGION_KEY)?.trim() || GLOBAL_REGION_SCOPE;
}

export function writeAdminRegionScope(scope: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REGION_KEY, scope || GLOBAL_REGION_SCOPE);
}

export function isGlobalCountryScope(scope: string | null | undefined) {
  return !scope || scope === GLOBAL_COUNTRY_SCOPE;
}

export function isGlobalRegionScope(scope: string | null | undefined) {
  return !scope || scope === GLOBAL_REGION_SCOPE;
}

export function toCountryId(scope: string | null | undefined) {
  return isGlobalCountryScope(scope) ? undefined : scope ?? undefined;
}

export function toRegionId(scope: string | null | undefined) {
  return isGlobalRegionScope(scope) ? undefined : scope ?? undefined;
}
```

---

## 5. UI: AdminCountryScopeBar

The bar currently renders one country dropdown. Add a region dropdown that appears only when the selected country has regions.

```tsx
import { countryHasRegions, regionsFor, GLOBAL_REGION_SCOPE } from "@/src/lib/adminRegions";

type Props = {
  scope: string;            // country
  regionScope: string;      // region
  onScopeChange: (s: string) => void;
  onRegionScopeChange: (s: string) => void;
  // … existing props
};

// inside render:
const showRegion = countryHasRegions(scope);
const regions = regionsFor(scope);

return (
  <div className="scope-bar">
    <CountryDropdown value={scope} onChange={onScopeChange} />

    {showRegion && (
      <RegionDropdown
        value={regionScope}
        onChange={onRegionScopeChange}
        options={[
          { value: GLOBAL_REGION_SCOPE, label: `All ${scope}` },
          ...regions.map(r => ({ value: r.code, label: r.label })),
        ]}
      />
    )}
  </div>
);
```

---

## 6. UI: BusinessSettingsFeaturePage (System Tax)

The current page reads `countryScope` and passes `selectedCountryId` to load/save. Mirror it for region:

```tsx
const [countryScope, setCountryScope] = useState(() => readAdminCountryScope());
const [regionScope, setRegionScope] = useState(() => readAdminRegionScope());

const selectedCountryId = toCountryId(countryScope);
const selectedRegionId  = toRegionId(regionScope);

// On scope change, clear region (already cleared in writeAdminCountryScope, but be defensive)
const handleCountryScopeChange = (scope: string) => {
  setCountryScope(scope);
  setRegionScope(GLOBAL_REGION_SCOPE);
  writeAdminCountryScope(scope);
};

const handleRegionScopeChange = (scope: string) => {
  setRegionScope(scope);
  writeAdminRegionScope(scope);
};

// Load tax rules scoped to (country, region):
useEffect(() => {
  loadFeatureState(feature, selectedCountryId, selectedRegionId);
}, [feature, selectedCountryId, selectedRegionId]);

// In the existing <AdminCountryScopeBar>, pass the new props:
<AdminCountryScopeBar
  scope={countryScope}
  regionScope={regionScope}
  onScopeChange={handleCountryScopeChange}
  onRegionScopeChange={handleRegionScopeChange}
/>
```

Show the active scope above the tax rules table so admins are never confused about which level they're editing:

```tsx
<div className="scope-label">
  Editing tax rules for: <strong>{countryScope === "GLOBAL" ? "All countries" : countryScope}</strong>
  {selectedRegionId && <> / <strong>{selectedRegionId}</strong></>}
</div>
```

---

## 7. API: platformSettingsDraftApi

Edit `src/lib/platformSettingsDraftApi.ts` to pass `regionId` alongside `countryId`:

```ts
export function listPlatformSettingsDraft(
  feature: PlatformSettingsSection,
  countryId?: string,
  regionId?: string,           // ← new
) {
  return apiRequest<...>(`/admin/platform-settings/${feature}`, {
    query: { countryId, regionId },
  });
}

export function savePlatformSettingsDraft(
  feature: PlatformSettingsSection,
  payload: {...},
  countryId?: string,
  regionId?: string,           // ← new
) {
  return apiRequest<...>(`/admin/platform-settings/${feature}`, {
    method: "PUT",
    body: JSON.stringify({ ...payload, countryId, regionId }),
  });
}
```

The backend then persists `TaxRule { country, region, … }` per the [backend spec](./backend-multi-currency.md#4-data-model-changes).

---

## 8. Currency display fix in Pricing Rules

Currently `app/(protected)/rentals/pricing-rules/page.tsx:43-47` hardcodes `currency: "NGN"`. With multi-country, format using the current country scope:

```ts
import { readAdminCountryScope, isGlobalCountryScope } from "@/src/lib/adminCountryScope";

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  NG: "NGN", US: "USD", GB: "GBP", CA: "CAD", AU: "AUD",
  GH: "GHS", KE: "KES", ZA: "ZAR",
};

function currencyForScope() {
  const scope = readAdminCountryScope();
  if (isGlobalCountryScope(scope)) return "USD";  // pick a neutral default for "GLOBAL"
  return COUNTRY_TO_CURRENCY[scope] ?? "USD";
}

function fmtMoney(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyForScope(),
    maximumFractionDigits: 0,
  }).format(v);
}
```

This makes deposit values show as `$200` for US scope, `₦20,000` for NG scope, etc. — without needing FX conversion (the underlying value is just a number, the unit is implied by scope).

---

## 9. UX notes

- **Region dropdown is hidden when country has no sub-regions** (NG, GB, FR, DE, …). Don't show an empty dropdown.
- **Switching country resets region to "All"**. Already enforced in `writeAdminCountryScope`.
- **Surface the active scope** above any settings table so the admin never edits the wrong scope. Already covered in §6.
- **The "ALL" region scope** is for editing country-wide rules (e.g. a federal rental surcharge that applies across all US states). State-specific rules go under their own region.

---

## 10. Testing checklist

- [ ] Country = NG → region dropdown hidden, only country-wide tax rules editable
- [ ] Country = US, region = ALL → country-wide US rules editable (federal/all-states)
- [ ] Country = US, region = CA → only California-scoped tax rules shown
- [ ] Switching country from US to NG clears region back to "All"
- [ ] Refresh page → both country and region scope persist via localStorage
- [ ] Saving a tax rule under US/CA hits backend with `{country: "US", region: "CA"}` in payload
- [ ] Pricing Rules page formats `depositValue` with the correct currency symbol for the current country scope
- [ ] Country = GLOBAL → fmtMoney falls back to USD (or your chosen neutral default)

---

## 11. Scope estimate

| Task | Effort |
|---|---|
| Add `adminRegions.ts` + extend `adminCountryScope.ts` | 1 hr |
| Update `AdminCountryScopeBar` with region dropdown | 2 hr |
| Wire region into `BusinessSettingsFeaturePage` (System Tax) | 2 hr |
| Update `platformSettingsDraftApi.ts` for region param | 1 hr |
| Fix pricing-rules page currency formatting | 30 min |
| Tax rule seeds UI (optional helper to bulk-import state seeds) | 2 hr |
| Manual QA + testing checklist | 1 hr |

Total: **~1 day of dashboard work**. Pairs naturally with Phase 6 in the [backend rollout](./backend-multi-currency.md#10-suggested-rollout).
