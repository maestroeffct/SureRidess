/**
 * Draft store — persists in-progress user flows across app kills so
 * "resume where you left off" works without a round trip.
 *
 * A draft is a plain JSON blob keyed by scope (`checkout`, `kyc`,
 * `search`, …). At most one live draft per scope. Drafts carry an
 * `expiresAt` so stale drafts don't resurrect a car that's already
 * been rented out or a KYC step that's already been finished.
 *
 * On successful completion of a flow, call `clearDraft(scope)` so
 * the resume banner doesn't reappear.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

type DraftScope = 'checkout' | 'kyc' | 'search' | 'support' | 'damage';

// Envelope wraps whatever the caller stores so we can add server-side
// invalidation later (e.g. version-bump forces all drafts to expire).
type DraftEnvelope<T> = {
  version: 1;
  scope: DraftScope;
  payload: T;
  savedAt: number;
  expiresAt: number;
};

const KEY = (scope: DraftScope) => `@sureride:draft:${scope}`;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h — long enough for
                                             // sleep-through-your-checkout;
                                             // short enough that stale
                                             // pickup dates die naturally

export async function saveDraft<T>(
  scope: DraftScope,
  payload: T,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  const envelope: DraftEnvelope<T> = {
    version: 1,
    scope,
    payload,
    savedAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  try {
    await AsyncStorage.setItem(KEY(scope), JSON.stringify(envelope));
  } catch (e) {
    console.warn('[drafts] save failed', scope, e);
  }
}

export async function loadDraft<T>(scope: DraftScope): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY(scope));
    if (!raw) return null;
    const env = JSON.parse(raw) as DraftEnvelope<T>;
    if (env.version !== 1) return null;
    if (env.expiresAt < Date.now()) {
      // Expired — clean up so the next read is fast.
      await AsyncStorage.removeItem(KEY(scope));
      return null;
    }
    return env.payload;
  } catch (e) {
    console.warn('[drafts] load failed', scope, e);
    return null;
  }
}

export async function clearDraft(scope: DraftScope): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY(scope));
  } catch {
    // ignore
  }
}

/**
 * Debounced save — call on every change; only writes to disk after
 * `waitMs` of silence. Prevents thrashing storage on every keystroke
 * / stepper tap in Checkout.
 */
export function makeDebouncedSaver<T>(scope: DraftScope, waitMs = 500) {
  let handle: ReturnType<typeof setTimeout> | null = null;
  return (payload: T) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => {
      void saveDraft(scope, payload);
      handle = null;
    }, waitMs);
  };
}

/* ── Checkout draft — canonical shape ─────────────────────────────
   Kept in this file (not the Checkout screen) so the Home resume
   banner + any future flows can read it without dragging the screen
   into their imports. */

export type CheckoutDraft = {
  carId: string;
  carName: string;
  carImage?: string;
  pickupAt: string;   // ISO
  returnAt: string;   // ISO
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupLocationName?: string;
  insuranceId?: string | null;
  addons?: Array<{ addonId: string; quantity: number }>;
  gatewayKey?: string;
  paymentMethod?: 'ONLINE' | 'COLLECTION';
  currency?: string;
  totalPreview?: number;
  // Tracks how far the user got — used by the resume banner to word
  // its CTA ("Continue checkout" vs "Complete payment").
  step: 'CHECKOUT' | 'PAYMENT';
  bookingId?: string; // set only after the booking is created
};
