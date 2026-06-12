import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import dayjs from 'dayjs';

import { Typo } from '@/components/AppText/Typo';
import { StarRating } from '@/components/StarRating/StarRating';
import { useTheme } from '@/theme/ThemeProvider';
import {
  getCarReviewStats,
  listCarReviews,
} from '@/services/review.service';
import type {
  RentalCarReview,
  RentalCarReviewStats,
} from '@/types/rental';

type Props = {
  carId: string;
  /** Optional: aggregates already available from the parent (e.g. from car detail) */
  initialAverage?: number;
  initialCount?: number;
  /** Default 3 — number of latest reviews shown inline. */
  previewLimit?: number;
};

export function ReviewsSection({
  carId,
  initialAverage,
  initialCount,
  previewLimit = 3,
}: Props) {
  const { mode, colors } = useTheme();

  const [stats, setStats] = useState<RentalCarReviewStats | null>(() =>
    typeof initialAverage === 'number' && typeof initialCount === 'number'
      ? {
          averageRating: initialAverage,
          reviewCount: initialCount,
          breakdown: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        }
      : null,
  );
  const [reviews, setReviews] = useState<RentalCarReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, r] = await Promise.all([
          getCarReviewStats(carId),
          listCarReviews(carId, { limit: previewLimit }),
        ]);
        if (cancelled) return;
        setStats(s);
        setReviews(r.items);
      } catch {
        // fall back to empty state — no toast since this is non-blocking
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [carId, previewLimit]);

  // Hide the section entirely while loading the first time AND no aggregates
  // were preloaded — keeps the layout from jumping.
  if (loading && !stats) return null;

  const avg = stats?.averageRating ?? 0;
  const count = stats?.reviewCount ?? 0;

  if (count === 0) {
    return (
      <View style={s.emptyWrap}>
        <View
          style={[
            s.emptyIcon,
            { backgroundColor: mode === 'dark' ? '#1F1F1F' : '#F3F4F6' },
          ]}
        >
          <Icon
            name="star-outline"
            size={22}
            color={colors.textSecondary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Typo style={[s.emptyTitle, { color: colors.textPrimary }]}>
            No reviews yet
          </Typo>
          <Typo style={[s.emptyHint, { color: colors.textSecondary }]}>
            Be the first to review after your trip.
          </Typo>
        </View>
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      {/* Summary row */}
      <View style={s.summaryRow}>
        <View>
          <Typo style={[s.avgValue, { color: colors.textPrimary }]}>
            {avg.toFixed(1)}
          </Typo>
          <StarRating value={avg} size={14} />
        </View>
        <View style={{ flex: 1, paddingLeft: 16 }}>
          <Typo style={[s.countText, { color: colors.textPrimary }]}>
            {count} review{count !== 1 ? 's' : ''}
          </Typo>
          <Typo style={[s.countHint, { color: colors.textSecondary }]}>
            Verified post-trip reviews from past renters
          </Typo>
        </View>
      </View>

      {/* Reviews list */}
      <View style={s.reviewList}>
        {reviews.map(r => (
          <View key={r.id} style={[s.reviewCard, { borderColor: colors.border }]}>
            <View style={s.reviewHeader}>
              <View style={{ flex: 1 }}>
                <Typo style={[s.reviewName, { color: colors.textPrimary }]}>
                  {r.userDisplayName || 'Anonymous'}
                </Typo>
                <Typo style={[s.reviewDate, { color: colors.textSecondary }]}>
                  {dayjs(r.createdAt).format('MMM D, YYYY')}
                </Typo>
              </View>
              <StarRating value={r.rating} size={13} />
            </View>
            {r.comment ? (
              <Typo style={[s.reviewComment, { color: colors.textPrimary }]}>
                {r.comment}
              </Typo>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 14 },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgValue: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
  },
  countText: { fontSize: 14, fontWeight: '600' },
  countHint: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  reviewList: { gap: 10 },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  reviewName: { fontSize: 13, fontWeight: '700' },
  reviewDate: { fontSize: 11, marginTop: 1 },
  reviewComment: { fontSize: 13, lineHeight: 18 },

  emptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 14, fontWeight: '700' },
  emptyHint: { fontSize: 12, marginTop: 2, lineHeight: 16 },
});
