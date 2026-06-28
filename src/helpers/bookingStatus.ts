import dayjs, { Dayjs } from 'dayjs';

// ── Status palette ──────────────────────────────────────────────────────────
// Centralised here so card, list filters, and any future timeline view all
// agree on what each status looks like.

export type BookingBucket = 'upcoming' | 'active' | 'past';

export type BookingStatusInfo = {
  /** Tab this booking should show under. */
  bucket: BookingBucket;
  /** Short status word for the overlay badge ("Confirmed", "Cancelled", …). */
  badgeLabel: string;
  /** Status colour — used for both the badge and the "what's next" pill tint. */
  accent: string;
  /** What the user needs to know about this booking right now. */
  nextLabel: string;
  /** Optional secondary line under nextLabel (date, location, etc). */
  nextDetail?: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending payment',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const ACCENT_BY_STATUS: Record<string, string> = {
  PENDING: '#F59E0B', // amber — needs action
  CONFIRMED: '#0A6A4B', // brand green — locked in
  COMPLETED: '#6B7280', // neutral grey — done
  CANCELLED: '#EF4444', // red — terminated
};

function pickup(when?: string | null): Dayjs | null {
  if (!when) return null;
  const d = dayjs(when);
  return d.isValid() ? d : null;
}

function formatTime(d: Dayjs) {
  return d.format('h:mm A');
}

function formatDate(d: Dayjs) {
  return d.format('D MMM');
}

function relativeDayLabel(target: Dayjs, now: Dayjs): string {
  const startOfTarget = target.startOf('day');
  const startOfNow = now.startOf('day');
  const days = startOfTarget.diff(startOfNow, 'day');
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * Computes the bucket + display fields for a booking, given its raw status
 * and pickup/return ISO strings. Pass `now` in tests; defaults to live time.
 */
export function getBookingStatusInfo(
  rawStatus: string | null | undefined,
  pickupAtRaw?: string | null,
  returnAtRaw?: string | null,
  now: Dayjs = dayjs(),
): BookingStatusInfo {
  const status = (rawStatus ?? 'PENDING').toUpperCase();
  const accent = ACCENT_BY_STATUS[status] ?? '#6B7280';
  const badgeLabel = STATUS_LABELS[status] ?? status;
  const pickupAt = pickup(pickupAtRaw);
  const returnAt = pickup(returnAtRaw);

  if (status === 'COMPLETED') {
    return {
      bucket: 'past',
      accent,
      badgeLabel,
      nextLabel: 'Trip completed',
      nextDetail: returnAt ? formatDate(returnAt) : undefined,
    };
  }

  if (status === 'CANCELLED') {
    return {
      bucket: 'past',
      accent,
      badgeLabel,
      nextLabel: 'Cancelled',
      nextDetail: pickupAt ? `Was due ${formatDate(pickupAt)}` : undefined,
    };
  }

  if (status === 'PENDING') {
    return {
      bucket: 'upcoming',
      accent,
      badgeLabel,
      nextLabel: 'Awaiting confirmation',
      nextDetail: pickupAt
        ? `Pickup ${formatDate(pickupAt)} · ${formatTime(pickupAt)}`
        : undefined,
    };
  }

  // CONFIRMED — split into upcoming vs active by where we are vs the window.
  const isAfterPickup = pickupAt ? now.isAfter(pickupAt) : false;
  const isBeforeReturn = returnAt ? now.isBefore(returnAt) : true;
  const isActiveTrip = isAfterPickup && isBeforeReturn;

  if (isActiveTrip) {
    return {
      bucket: 'active',
      accent,
      badgeLabel,
      nextLabel: returnAt
        ? `Trip ends ${relativeDayLabel(returnAt, now)}`
        : 'Trip in progress',
      nextDetail: returnAt
        ? `${formatDate(returnAt)} · ${formatTime(returnAt)}`
        : undefined,
    };
  }

  // Upcoming confirmed — describe the pickup window.
  if (pickupAt) {
    return {
      bucket: 'upcoming',
      accent,
      badgeLabel,
      nextLabel: `Pickup ${relativeDayLabel(pickupAt, now)}`,
      nextDetail: `${formatDate(pickupAt)} · ${formatTime(pickupAt)}`,
    };
  }

  return {
    bucket: 'upcoming',
    accent,
    badgeLabel,
    nextLabel: 'Confirmed',
  };
}
