import { api } from './api';
import type {
  RentalCar,
  RentalInsurancePackage,
  RentalSearchParams,
  RentalSearchResult,
} from '@/types/rental';

export async function searchRentalCars(params: RentalSearchParams) {
  const response = await api.post<RentalSearchResult>(
    '/rental/search',
    {},
    {
      params,
    },
  );

  return response.data;
}

export async function listRentalCars(params: { country?: string } = {}) {
  const response = await api.get<RentalCar[]>('/rental/cars', {
    params: params.country ? { country: params.country.toUpperCase() } : undefined,
  });
  return response.data;
}

export async function getCarWithFeatures(carId: string) {
  const response = await api.get<RentalCar>(`/api/cars/${carId}`);
  return response.data;
}

/**
 * Renter-facing protection-plan catalogue. Returns only APPROVED plans,
 * either car-scoped or provider-wide. Prefer this over the plans
 * embedded on the car detail response — those may include PENDING or
 * REJECTED rows that shouldn't be sellable.
 */
export async function listCarProtectionPlans(
  carId: string,
): Promise<RentalInsurancePackage[]> {
  const response = await api.get<{ items: RentalInsurancePackage[] }>(
    `/rental/cars/${encodeURIComponent(carId)}/protection-plans`,
  );
  return response.data.items ?? [];
}
