import { PixelRatio } from 'react-native';

// ── Per-context size presets ───────────────────────────────────────────────
// Values are logical (CSS) pixels — the helper multiplies by the device
// pixel ratio so retina screens still receive crisp images.
//
// Always pick the SMALLEST preset that's bigger than the rendered surface.
// A 160-wide CarCard thumb does NOT need a 1200-wide hero file.

export const ImageSize = {
  /** ~60x60 — avatars, list row icons */
  AVATAR: 64,
  /** ~160-200 wide — CarCard list thumbs in scrollable rows */
  THUMB: 240,
  /** ~280-300 wide — FeaturedCard carousel cards */
  CARD: 360,
  /** Full-width hero — VehicleDetails / Payment top of screen */
  HERO: 1080,
} as const;

type Opts = {
  /** Logical width in CSS pixels. Helper multiplies by device pixel ratio. */
  width: number;
  /**
   * Quality 1-100. Default 'auto' (Cloudinary picks per content/network) for
   * smaller files without manual tuning.
   */
  quality?: number | 'auto';
};

/**
 * Returns a CDN-optimized URL when possible, otherwise the original URL.
 *
 * Supports:
 *  - Cloudinary URLs (`https://res.cloudinary.com/<cloud>/image/upload/...`)
 *    → injects `w_<px>,c_limit,q_auto,f_auto,dpr_auto`
 *  - S3 / non-CDN URLs → returned unchanged. Add CloudFront + an image
 *    Lambda later if S3 thumbnails become a perf issue.
 *  - Empty / undefined / non-string → returned as-is.
 */
export function optimizeImageUrl(
  url: string | null | undefined,
  opts: Opts,
): string | null | undefined {
  if (!url || typeof url !== 'string') return url;

  // Cloudinary transforms live between `/upload/` and the public ID
  const CLOUDINARY_UPLOAD = '/image/upload/';
  const idx = url.indexOf(CLOUDINARY_UPLOAD);
  if (idx === -1 || !url.includes('res.cloudinary.com')) return url;

  const effectiveWidth = Math.round(opts.width * PixelRatio.get());
  const quality = opts.quality ?? 'auto';
  const transforms = [
    `w_${effectiveWidth}`,
    'c_limit', // never upscale past the original
    `q_${quality}`,
    'f_auto',
    'dpr_auto',
  ].join(',');

  // If the URL already has a transform segment, don't double-stack — replace it.
  // Cloudinary transforms start with `[a-z]_` and end at the next `/`.
  const after = url.slice(idx + CLOUDINARY_UPLOAD.length);
  const ALREADY_TRANSFORMED = /^[a-z]+_[^/]+\//.test(after);
  const tail = ALREADY_TRANSFORMED ? after.replace(/^[a-z]+_[^/]+\//, '') : after;

  return `${url.slice(0, idx)}${CLOUDINARY_UPLOAD}${transforms}/${tail}`;
}
