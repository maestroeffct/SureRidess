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

export async function createPaymentSheetSession(payload: PaymentSheetPayload) {
  const response = await api.post<PaymentSheetSession>(
    '/payments/payment-sheet',
    payload,
  );
  return response.data;
}
