/**
 * Public promo banners — admin-managed via Platform Settings > Banners.
 * Backend filters by isActive + current-date window before responding, so
 * we render whatever it returns in order.
 */

import { api } from './api';

export type BannerPlacement =
  | 'HOME_HERO'
  | 'HOME_BELOW_HERO'
  | 'BOOKING_TOP'
  | 'PROFILE_TOP';

export type PromoBanner = {
  id: string;
  title: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  placement: BannerPlacement;
  sortOrder: number;
};

export async function fetchPromoBanners(
  placement?: BannerPlacement,
): Promise<PromoBanner[]> {
  try {
    const res = await api.get<{ items: PromoBanner[] }>('/platform/banners', {
      params: placement ? { placement } : undefined,
    });
    return Array.isArray(res.data?.items) ? res.data.items : [];
  } catch {
    // Banners are a soft feature — never let a fetch failure break the
    // surrounding screen; just render nothing.
    return [];
  }
}
