# Backend: Multi-currency Pricing & FX

This spec describes the backend work needed for SureRide to support multiple display currencies (NGN, USD, GBP, EUR, etc.) end-to-end — from price display to Stripe checkout.

The mobile app is already wired for this. It auto-derives a default currency from the user's signup country, lets the user override it from Profile → Currency, and **sends `displayCurrency` on every pricing-preview request**. Today the backend ignores it; this doc describes what to do with it.

---

## 1. Goal

A user in the US should be able to:

1. Sign up — auto-defaulted to USD.
2. Browse a Nigerian car priced at ₦35,000/day and see it as **$23.46/day** (live FX).
3. Switch their display currency to GBP in Profile → see **£18.50/day** instantly.
4. Pay at checkout — Stripe charges them in **their selected currency**, not the provider's.
5. Provider still gets paid out in **their** currency (NGN), with the platform absorbing FX spread.

---

## 2. API contract

### Existing endpoint: `POST /rental/pricing-preview`

**Request — add `displayCurrency`:**

```jsonc
{
  "carId": "abc123",
  "pickupAt": "2026-06-10T09:00:00Z",
  "returnAt": "2026-06-12T09:00:00Z",
  "insuranceId": "ins_xyz",
  "displayCurrency": "USD"   // ← NEW. ISO 4217. Optional. May be missing/null.
}
```

**Response — already has `currency`, just ensure it reflects the converted value:**

```jsonc
{
  "data": {
    "rentalDays": 2,
    "basePrice": 46.92,           // converted to USD
    "insuranceFee": 6.71,
    "subtotal": 53.63,
    "taxAmount": 4.02,
    "taxRate": 0.075,
    "taxes": [...],
    "depositAmount": 13.41,
    "totalPrice": 57.65,
    "currency": "USD",            // ← echoes the resolved currency
    "providerCurrency": "NGN",    // ← NEW. The car's real native currency
    "fxRate": 0.000670,           // ← NEW. 1 NGN = 0.000670 USD at quote time
    "fxQuoteId": "fx_2026-06-08T..." // ← NEW. Stable rate for ~10 min so checkout matches preview
  }
}
```

**Resolution rules:**

1. `displayCurrency` missing → behave exactly as today (no conversion).
2. `displayCurrency === providerCurrency` → no conversion. Return as today plus the new fields.
3. `displayCurrency !== providerCurrency` → fetch FX, convert every amount, set `currency = displayCurrency`.
4. FX fetch fails → fall back to provider currency, set `currency = providerCurrency`. Don't 500.

### New endpoint: `POST /payments/checkout-session`

Same shape as today, but accept `displayCurrency`:

```jsonc
{
  "bookingId": "bk_xyz",
  "displayCurrency": "USD"
}
```

Backend creates the Stripe PaymentIntent in `displayCurrency` (see §5).

---

## 3. FX rates

### Provider options

| Provider | Free tier | Refresh | Notes |
|---|---|---|---|
| **exchangerate.host** | Yes, unlimited | Hourly | Recommended for v1. Reliable, no API key needed. |
| **openexchangerates.org** | 1k req/mo | Hourly | Needs key. More currency coverage. |
| **CurrencyLayer** | 100 req/mo free | Hourly | Needs key. |
| **fixer.io** | 100 req/mo free | Hourly | EUR-base on free tier. |

Start with **exchangerate.host**. Endpoint:
```
GET https://api.exchangerate.host/latest?base=NGN&symbols=USD,GBP,EUR
```

### Caching

- Cache rates in Redis (or in-memory) with a **15-minute TTL**.
- Refresh on a cron every 10 minutes so requests never wait on the third-party.
- One cache key per base currency: `fx:NGN`, `fx:USD`, etc.

### Quote stability

When `pricing-preview` returns, also persist the rate as a `FxQuote { id, base, target, rate, expiresAt }` row valid for ~10 min. At checkout, use that exact `fxQuoteId` so the customer is never charged a different amount than what they previewed.

If the quote has expired by checkout, return `FX_QUOTE_EXPIRED` and let the client re-fetch pricing-preview.

---

## 4. Data model changes

### `Provider`

Already has `payoutAccount.currency`. Ensure every provider has one set (default `'NGN'` for existing rows).

### `Car`

Inherits currency from its provider. No new column needed; just resolve via `car.provider.payoutAccount.currency`.

### `Booking`

Add two columns:
```
displayCurrency   String     // e.g. "USD" — what the user paid in
providerCurrency  String     // e.g. "NGN" — what the provider gets paid in
fxRate            Decimal?   // null when displayCurrency === providerCurrency
```

This makes refunds and disputes traceable.

### New table: `FxQuote`

```
id             String   @id
base           String
target         String
rate           Decimal
createdAt      DateTime
expiresAt      DateTime
```

Periodically prune expired rows (cron daily).

### Country + region tax (the model)

Sales tax is **multi-tier** in many countries (US has federal 0% + state 0-7.25% + sometimes city/local on top). Nigeria is simple (one national VAT 7.5%). UK is simple (one VAT 20%). The schema needs to handle both.

```
TaxRule {
  id          String   @id
  country     String   // ISO 3166-1 alpha-2, e.g. "NG", "US", "GB"
  region      String?  // State/province code, e.g. "CA", "NY". null = whole country.
  code        String   // unique per (country, region), e.g. "VAT", "CA_SALES"
  label       String   // displayed on the receipt — "VAT", "California Sales Tax"
  rate        Decimal  // 0-1, e.g. 0.075
  kind        String   // "VAT" | "SALES_TAX" | "RENTAL_SURCHARGE"
  active      Boolean  @default(true)
}
```

**Important: tax is resolved by the car's pickup location, NOT the customer's country.** This is the legal convention for rentals — you rent a car in California, you pay California tax, regardless of where the customer lives.

So `Location` (where cars are picked up) must carry both `country` and `region`:

```
Location {
  ...existing fields
  country   String     // "US"
  region    String?    // "CA", "NY"; null in countries without state-level tax
}
```

---

## 5. Multi-tier tax resolution

### Algorithm

Given a booking's pickup location:

```ts
async function resolveTaxes(pickup: Location, subtotal: number) {
  const rules = await db.taxRule.findMany({
    where: {
      country: pickup.country,
      active: true,
      OR: [
        { region: null },           // country-wide rules (VAT in NG/UK, etc.)
        { region: pickup.region },  // state-specific rules (CA, NY, etc.)
      ],
    },
  });

  const taxes = rules.map(r => ({
    label: r.label,
    code: r.code,
    rate: Number(r.rate),
    amount: subtotal * Number(r.rate),
  }));

  const taxAmount = taxes.reduce((sum, t) => sum + t.amount, 0);
  const taxRate = taxes.reduce((sum, t) => sum + t.rate, 0);
  return { taxes, taxAmount, taxRate };
}
```

The `taxes[]` array is already in the `PricingPreview` response — the mobile app's `PriceBreakdown` already renders one row per tax line item. So a NY booking with state tax + city tax shows two rows; a NG booking shows one VAT row. No mobile change needed.

### Worked examples

**Nigeria — Lagos pickup**

`Location { country: "NG", region: null }`

| TaxRule | country | region | rate |
|---|---|---|---|
| VAT | NG | null | 0.075 |

→ Single row: `VAT (7.5%) — ₦2,625` on a ₦35,000 subtotal.

**United States — California pickup**

`Location { country: "US", region: "CA" }`

| TaxRule | country | region | rate |
|---|---|---|---|
| CA Sales Tax | US | CA | 0.0725 |

→ Single row: `California Sales Tax (7.25%) — $3.39` on a $46.92 subtotal.

**United States — New York City pickup**

For v1, store the **combined** NYC rate in a single rule (saves modelling city-level tax — most users picking up "in NY" are picking up in NYC anyway):

| TaxRule | country | region | rate |
|---|---|---|---|
| NY Sales Tax | US | NY | 0.08875 |

→ Single row: `New York Sales Tax (8.875%) — $4.16`.

If you later need true city-level granularity (e.g. upstate NY = 8% vs NYC = 8.875%), add a `city` column and extend the resolver. Don't bother now.

**UK — London pickup**

`Location { country: "GB", region: null }`

| TaxRule | country | region | rate |
|---|---|---|---|
| VAT | GB | null | 0.20 |

→ Single row: `VAT (20%) — £3.70`.

**Stacked example — California with a hypothetical federal car rental tax**

| TaxRule | country | region | rate |
|---|---|---|---|
| Federal Rental Surcharge | US | null | 0.02 |
| CA Sales Tax | US | CA | 0.0725 |

→ Two rows in the receipt: `Federal Rental Surcharge (2%) — $0.94` + `California Sales Tax (7.25%) — $3.39`. Total tax 9.25%.

### Dashboard implications

The current dashboard's `AdminCountryScopeBar` switches between "GLOBAL" and a country. Two additions needed:

1. When the scope is a country **with regions** (US, CA, AU), show a second dropdown for the region. Tax rules are saved under `{country, region}` instead of just `{country}`.
2. Seed the common tax rates so an admin doesn't have to type each US state by hand. A `TAX_RULE_SEEDS` constant covering all 50 US states + DC + common provinces is fine for v1.

### Initial seed data

Run a one-time seed to populate v1 rates:

```
NG: VAT 7.5%
GB: VAT 20%
DE/FR/ES/IT/NL/IE: VAT (per-country, ~19-23%)
GH: VAT 12.5%
KE: VAT 16%
ZA: VAT 15%
AU: GST 10%
CA (provinces): GST 5% + provincial PST/HST varies — store as combined per province
US (states): Sales tax per state — see https://taxfoundation.org/data/all/state/state-sales-tax-rates/
```

Don't try to be exhaustive on day one. Cover the states you actually have pickup locations in. Add others lazily.

---

## 6. Stripe integration

### Currency handling

Stripe natively supports ~135 currencies. Just pass the converted amount:

```ts
await stripe.paymentIntents.create({
  amount: Math.round(convertedTotal * 100),  // in smallest unit
  currency: displayCurrency.toLowerCase(),    // 'usd'
  metadata: {
    bookingId,
    providerCurrency,
    fxQuoteId,
    providerAmount: providerTotal.toString(),
  },
});
```

### Payout to provider

This is the operationally tricky bit. Two approaches:

**A) Same-currency payout (simplest)**

- Customer pays in USD → Stripe converts to NGN via Stripe FX (~2% spread).
- Provider's connected Stripe account is set to NGN payouts.
- You absorb the FX spread.

**B) Platform-absorbed FX (cleaner accounting)**

- Customer pays in USD → Stripe holds USD on platform account.
- You separately initiate a payout to the provider in NGN using your own banking rails (or Wise, etc.).
- More work, but you get a clean audit trail and can shop for better FX rates.

Start with **A** for v1.

---

## 7. Edge cases

| Case | Behaviour |
|---|---|
| User picks a currency Stripe doesn't support | Reject at pricing-preview time with `UNSUPPORTED_CURRENCY` |
| FX provider down at preview time | Return provider's native currency, log error, alert ops |
| FX quote expired at checkout | Return `FX_QUOTE_EXPIRED`, client re-fetches preview |
| Refund after FX moved | Refund the exact `displayCurrency` amount the customer paid (Stripe handles this) |
| User changes currency mid-booking flow | Pricing-preview re-runs, new fxQuote issued |
| Same-currency booking (NG user, NG car) | Skip FX entirely. `fxRate: null`, `currency === providerCurrency` |
| Insurance package priced in provider currency | Convert with the same fxRate as the rest of the booking |

---

## 8. Testing checklist

### Currency / FX
- [ ] NG user, NG car → NGN displayed, NGN charged. No fxRate.
- [ ] US user, NG car → USD displayed, USD charged. FX applied.
- [ ] US user, US car → USD displayed, USD charged. No fxRate (same currency).
- [ ] FX cache hit (no third-party call within 15 min)
- [ ] FX cache miss triggers refresh, populates cache
- [ ] FX provider returns error → falls back to provider currency, no 500
- [ ] Preview → wait 11 min → checkout → returns FX_QUOTE_EXPIRED
- [ ] Deposit: PERCENTAGE rule applied to converted total (so 30% of $100, not 30% of ₦35,000)
- [ ] Stripe metadata includes `providerCurrency`, `providerAmount`, `fxQuoteId`

### Multi-tier tax
- [ ] NG pickup (no region) → single VAT row at 7.5%
- [ ] GB pickup → single VAT row at 20%
- [ ] US pickup in California → single row "California Sales Tax (7.25%)"
- [ ] US pickup in New York → single row "New York Sales Tax (8.875%)"
- [ ] US pickup in Oregon (no sales tax) → zero tax rows, taxAmount = 0
- [ ] Stacked: country-wide + region rule on same booking → two rows, summed correctly
- [ ] Pickup location's country/region drives tax (NOT the customer's country)
- [ ] Inactive TaxRule is excluded from resolution

---

## 9. Mobile app — already done

Just for reference, the mobile side already does:

- `useCurrency()` provider with AsyncStorage persistence — [src/providers/CurrencyProvider.tsx](../src/providers/CurrencyProvider.tsx)
- Country → currency mapping — [src/helpers/currency.ts](../src/helpers/currency.ts)
- Auto-derive from `user.country` on bootstrap/login/refreshUser
- Profile → Currency picker (9 currencies)
- `previewBookingPrice` sends `displayCurrency` on every call
- `PriceBreakdown` displays whatever `currency` the backend returns

So when this backend work ships, **zero mobile changes are needed**. The picker just starts working.

---

## 10. Suggested rollout

1. **Phase 1 — provider currency baseline.** Ensure every provider has a real `currency` set. Audit dashboard. (~½ day)
2. **Phase 2 — Multi-tier tax schema + resolver.** Add `region` to `TaxRule` + `Location`. Build resolver. Seed common rates (NG VAT, GB VAT, top 5 US states). (~1½ days)
3. **Phase 3 — FX infra.** Pull rates, cache, persist quotes. Don't expose yet. (~1 day)
4. **Phase 4 — pricing-preview conversion + tax integration.** Honour `displayCurrency` + new tax resolver. Test with mobile app already sending currency. (~1 day)
5. **Phase 5 — Stripe in display currency.** Update payment-sheet session. (~½ day)
6. **Phase 6 — Dashboard region picker.** Add state dropdown when country = US/CA/AU. Admins can enter state-level tax rules from UI instead of seeds. (~1 day)

Total: ~5½–6 dev days for a solid v1.
