import { api } from './api';

export type CreateBookingPayload = {
  carId: string;
  pickupAt: string;
  returnAt: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  insuranceId?: string;
  paymentMethod?: 'ONLINE' | 'COLLECTION';
};

export type BookingSummary = {
  id: string;
  status: string;
  collectionCode?: string;
  paymentMethod?: string;
  totalPrice?: number;
  currency?: string;
};

export type BookingDetails = {
  id: string;
  collectionCode?: string;
  status: string;
  paymentMethod: string;

  car: {
    brand: string;
    model: string;
    category?: string;
    transmission?: string;
    seats?: number;
    hasAC?: boolean;
    mileagePolicy?: string;
    images?: Array<{ url: string; isPrimary?: boolean }>;
  };

  provider: {
    name: string;
    logo?: string;
    phone?: string;
    email?: string;
  };

  rentalPeriod: {
    pickupAt: string;
    returnAt: string;
    pickupLocation?: { name?: string; address?: string };
    dropoffLocationId?: string;
  };

  insurance?: {
    id: string;
    name: string;
    description?: string;
    dailyPrice?: number;
  } | null;

  payment: {
    basePrice: number;
    insuranceFee: number;
    taxAmount: number;
    totalPrice: number;
    currency: string;
    pricingUnit: string;
    status: string;
    provider?: string;
    reference?: string;
    paidAt?: string;
  };
};

export async function createBooking(payload: CreateBookingPayload) {
  const response = await api.post('/bookings', payload);
  return response.data as {
    message?: string;
    booking: BookingSummary;
  };
}

export async function fetchBookingDetails(bookingId: string) {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data as BookingDetails;
}

export async function confirmCollectionBooking(bookingId: string) {
  const response = await api.patch(`/bookings/${bookingId}/confirm-collection`);
  return response.data as {
    message?: string;
    booking: BookingSummary;
  };
}

export async function cancelBooking(bookingId: string) {
  const response = await api.patch(`/bookings/${bookingId}/cancel`);
  return response.data as {
    message?: string;
    booking: BookingSummary;
  };
}

export async function fetchUserBookings(status?: string) {
  const params = status ? { status } : undefined;
  const response = await api.get('/bookings', { params });
  return response.data as BookingSummary[];
}
