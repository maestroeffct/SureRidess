import { api } from './api';

export type PricingPreview = {
  rentalDays: number;
  basePrice: number;
  insuranceFee: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  taxInclusivePricing: boolean;
  taxes: Array<{ label: string; code: string; rate: number; amount: number }>;
  totalPrice: number;
  currency: string;
  platformFee: number;
  providerEarning: number;
  depositAmount: number;
  commissionRate: number;
  depositType: 'FIXED' | 'PERCENTAGE';
  depositValue: number;
  minRentalDays: number;
};

export async function previewBookingPrice(params: {
  carId: string;
  pickupAt: string;
  returnAt: string;
  insuranceId?: string;
  countryId?: string;
  /** ISO 4217 — backend may honour or ignore (FX support TBD). */
  displayCurrency?: string;
}): Promise<PricingPreview> {
  if (__DEV__) {
    console.log(
      '[Pricing] → request displayCurrency:',
      params.displayCurrency ?? '(none)',
    );
  }
  const response = await api.post<{ message: string; data: PricingPreview }>(
    '/rental/pricing-preview',
    params,
  );
  if (__DEV__) {
    const d = response.data.data;
    const matched = params.displayCurrency
      ? d.currency?.toUpperCase() === params.displayCurrency.toUpperCase()
      : null;
    console.log(
      '[Pricing] ← response currency:',
      d.currency,
      matched === null
        ? ''
        : matched
        ? '✓ backend honoured displayCurrency'
        : '⚠ backend ignored displayCurrency (FX not implemented)',
    );
    console.log('[Pricing] preview →', {
      basePrice: d.basePrice,
      insuranceFee: d.insuranceFee,
      subtotal: d.subtotal,
      taxAmount: d.taxAmount,
      taxRate: d.taxRate,
      taxes: d.taxes?.length ?? 0,
      depositAmount: d.depositAmount,
      totalPrice: d.totalPrice,
    });
  }
  return response.data.data;
}
