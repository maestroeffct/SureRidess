import { api } from './api';

export type CreateBookingPayload = {
  carId: string;
  pickupAt: string;
  returnAt: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  insuranceId?: string;
  paymentMethod?: 'ONLINE' | 'COLLECTION';
  /** Provider-offered extras. Prices are server-side authoritative. */
  addons?: Array<{ addonId: string; quantity?: number }>;
};

export type BookingAddOnLine = {
  id: string;
  addonId: string;
  name: string;
  unit: 'PER_RENTAL' | 'PER_DAY' | 'PER_HOUR';
  pricePerUnit: number;
  currency: string;
  quantity: number;
  lineTotal: number;
};

export type BookingSummary = {
  id: string;
  status: string;
  collectionCode?: string;
  paymentMethod?: string;
  paymentStatus?:
    | 'UNPAID'
    | 'REQUIRES_ACTION'
    | 'PROCESSING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'CANCELED';
  totalPrice?: number;
  currency?: string;
};

export type BookingDetails = {
  id: string;
  collectionCode?: string;
  status: string;
  paymentMethod: string;
  /** True when the user has already submitted a review for this booking. */
  hasReview?: boolean;

  car: {
    id?: string;
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
    tier?: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ELITE';
    deductibleAmount?: number | null;
    coverageType?: string | null;
    underwriter?: string | null;
  } | null;

  addons?: BookingAddOnLine[];

  /**
   * Provider-recorded handover inspections for this booking. The mobile
   * app renders a "Confirm & sign" button whenever an entry of the
   * current type exists without a customer signature yet.
   */
  handovers?: Array<{
    id: string;
    type: 'PICKUP' | 'RETURN';
    signedByCustomer: boolean;
    customerSignatureUrl: string | null;
    customerSignedAt: string | null;
    createdAt: string;
  }>;

  payment: {
    basePrice: number;
    insuranceFee: number;
    addonsFee?: number;
    // Same money as insuranceFee, protection-plan vocabulary
    protectionFeeTotal?: number;
    protectionDeductibleAmount?: number | null;
    protectionTier?: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ELITE' | null;
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
