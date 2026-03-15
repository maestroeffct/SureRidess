import { api } from './api';

export type CreateBookingPayload = {
  carId: string;
  pickupAt: string;
  returnAt: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  insuranceId?: string;
};

export type BookingSummary = {
  id: string;
  status: string;
  totalPrice?: number;
  currency?: string;
};

export async function createBooking(payload: CreateBookingPayload) {
  const response = await api.post('/bookings', payload);
  return response.data as {
    message?: string;
    booking: BookingSummary;
  };
}
