import { api } from './api';
import type {
  RentalLocation,
  RentalLocationSearchParams,
} from '@/types/rental';

export async function searchRentalLocations(
  params: RentalLocationSearchParams,
) {
  const response = await api.get<RentalLocation[]>('/rental/locations/search', {
    params,
  });

  return response.data;
}

export async function listRentalLocations() {
  const response = await api.get<RentalLocation[]>('/rental/locations');
  return response.data;
}
