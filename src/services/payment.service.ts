import { api } from './api';

export type PaymentConfig = {
  provider: 'STRIPE' | string;
  publishableKey: string;
  merchantDisplayName?: string;
};

export type PaymentSheetPayload = {
  bookingId: string;
};

export type PaymentSheetSession = {
  provider: 'STRIPE' | string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentIntentClientSecret: string;
  publishableKey: string;
};

export async function getPaymentConfig() {
  const response = await api.get<PaymentConfig>('/payments/config');
  return response.data;
}

export async function createPaymentSheetSession(payload: PaymentSheetPayload & { gatewayKey?: string }) {
  const response = await api.post<PaymentSheetSession>(
    '/payments/payment-sheet',
    payload,
  );
  return response.data;
}

/**
 * Client-triggered verify — the mobile WebView flow calls this the
 * moment the hosted checkout closes so the booking flips SUCCEEDED
 * without waiting on the provider's webhook. Backend re-checks with
 * the provider (Paystack /transaction/verify) so nothing is trusted
 * from the WebView URL alone.
 */
export async function verifyBookingPayment(
  bookingId: string,
  reference?: string,
): Promise<{ paymentStatus: string; alreadyResolved?: boolean; pending?: boolean }> {
  const response = await api.post<{
    paymentStatus: string;
    alreadyResolved?: boolean;
    pending?: boolean;
  }>(`/payments/verify-booking/${encodeURIComponent(bookingId)}`, { reference });
  return response.data;
}

export type PaymentGatewayOption = {
  gatewayKey: string;
  displayName: string;
  logoUrl: string | null;
  runtimeAdapter: 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE' | string;
  provider: 'STRIPE' | 'PAYSTACK' | 'FLUTTERWAVE' | string | null;
  mode: string;
  isDefault: boolean;
  publishableKey: string | null;
  merchantDisplayName?: string;
};

/**
 * Enabled + runtime-supported payment gateways as configured by admin in
 * the third-party settings. The mobile checkout renders one tile per
 * entry; falls back to whatever getPaymentConfig() returns if the list
 * is empty (legacy backend without the /payments/gateways endpoint).
 */
export async function listPaymentGateways(): Promise<PaymentGatewayOption[]> {
  const response = await api.get<{ items: PaymentGatewayOption[] }>(
    '/payments/gateways',
  );
  return response.data.items ?? [];
}
