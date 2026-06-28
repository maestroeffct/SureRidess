/**
 * Concierge limousine request — public endpoint, optional auth. Customers
 * tap the in-app Limousine banner, fill the form, and our admin queue
 * matches them with a provider manually.
 */

import { api } from './api';

export type SubmitLimousineRequestPayload = {
  customerName: string;
  contactEmail: string;
  contactPhone: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM
  pickupLocation: string;
  dropoffLocation?: string;
  passengerCount: number;
  eventType?: string;
  notes?: string;
};

export async function submitLimousineRequest(
  payload: SubmitLimousineRequestPayload,
) {
  const res = await api.post<{
    message: string;
    request: { id: string; status: string; createdAt: string };
  }>('/limousine-requests', payload);
  return res.data;
}
