import { api } from './api';
import type {
  RentalCar,
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

export async function listRentalCars() {
  const response = await api.get<RentalCar[]>('/rental/cars');
  return response.data;
}

export async function getCarWithFeatures(carId: string) {
  const response = await api.get<RentalCar>(`/api/cars/${carId}`);
  return response.data;
}
