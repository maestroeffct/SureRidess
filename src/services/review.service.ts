import { api } from './api';
import type {
  RentalCarReview,
  RentalCarReviewStats,
} from '@/types/rental';

export type CreateReviewPayload = {
  bookingId: string;
  rating: number;
  comment?: string;
};

export async function listCarReviews(
  carId: string,
  params: { limit?: number; cursor?: string } = {},
) {
  const response = await api.get<{
    items: RentalCarReview[];
    nextCursor: string | null;
  }>(`/rental/cars/${carId}/reviews`, { params });
  return response.data;
}

export async function getCarReviewStats(
  carId: string,
): Promise<RentalCarReviewStats> {
  const response = await api.get<RentalCarReviewStats>(
    `/rental/cars/${carId}/reviews/stats`,
  );
  return response.data;
}

export async function submitCarReview(
  carId: string,
  payload: CreateReviewPayload,
) {
  const response = await api.post<{
    message: string;
    review: RentalCarReview;
  }>(`/rental/cars/${carId}/reviews`, payload);
  return response.data;
}
