import React, { useMemo } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { useFormatMoney } from '@/providers/CurrencyProvider';
import { getBookingStatusInfo } from '@/helpers/bookingStatus';
import { ImageSize, optimizeImageUrl } from '@/helpers/image';

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=600';

type Props = {
  onPress: () => void;
  bookingId: string;
  carName: string;
  imageUrl?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupAt?: string;
  returnAt?: string;
  collectionCode?: string;
  status?: string;
  totalPrice?: number;
  currency?: string;
};

// Tint the "what's next" pill with the accent at low opacity. Hex + 1A/26
// alpha pairs give a soft tinted surface on both dark and light backgrounds.
function accentSurface(hex: string, isDark: boolean) {
  return `${hex}${isDark ? '33' : '1A'}`;
}

export const BookingCard = ({
  onPress,
  bookingId,
  carName,
  imageUrl,
  pickupLocation,
  pickupAt,
  returnAt,
  collectionCode,
  status,
  totalPrice,
  currency = 'NGN',
}: Props) => {
  const { colors, mode } = useTheme();
  const fmtMoney = useFormatMoney();

  const statusInfo = useMemo(
    () => getBookingStatusInfo(status, pickupAt, returnAt),
    [status, pickupAt, returnAt],
  );

  const days = useMemo(() => {
    if (!pickupAt || !returnAt) return null;
    const ms = new Date(returnAt).getTime() - new Date(pickupAt).getTime();
    if (!Number.isFinite(ms) || ms <= 0) return 1;
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [pickupAt, returnAt]);

  const heroUri =
    optimizeImageUrl(imageUrl ?? FALLBACK_IMAGE, { width: ImageSize.CARD }) ??
    FALLBACK_IMAGE;
  const shortId = bookingId.slice(0, 8).toUpperCase();
  const pillSurface = accentSurface(statusInfo.accent, mode === 'dark');

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[
        s.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {/* HERO IMAGE */}
      <View style={s.heroWrap}>
        <Image source={{ uri: heroUri }} style={s.hero} resizeMode="cover" />
        <View style={[s.statusBadge, { backgroundColor: statusInfo.accent }]}>
          <Typo style={s.statusBadgeText}>{statusInfo.badgeLabel}</Typo>
        </View>
        {collectionCode ? (
          <View style={s.codeBadge}>
            <Icon name="qr-code-outline" size={11} color="#fff" />
            <Typo style={s.codeBadgeText}>{collectionCode}</Typo>
          </View>
        ) : null}
      </View>

      {/* BODY */}
      <View style={s.body}>
        <Typo
          style={[s.title, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {carName}
        </Typo>

        {/* What's-next pill */}
        <View style={[s.nextPill, { backgroundColor: pillSurface }]}>
          <View style={[s.nextDot, { backgroundColor: statusInfo.accent }]} />
          <View style={{ flex: 1 }}>
            <Typo
              style={[s.nextLabel, { color: statusInfo.accent }]}
              numberOfLines={1}
            >
              {statusInfo.nextLabel}
            </Typo>
            {statusInfo.nextDetail ? (
              <Typo
                style={[s.nextDetail, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {statusInfo.nextDetail}
              </Typo>
            ) : null}
            {pickupLocation ? (
              <Typo
                style={[s.nextDetail, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {pickupLocation}
              </Typo>
            ) : null}
          </View>
        </View>
      </View>

      {/* FOOTER */}
      <View style={[s.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
        {typeof totalPrice === 'number' ? (
          <Typo
            style={[s.footerPrice, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {fmtMoney(totalPrice, currency, { round: true })}
          </Typo>
        ) : (
          <View />
        )}
        <View style={s.footerRight}>
          {days !== null && (
            <Typo style={[s.footerMeta, { color: colors.textSecondary }]}>
              {days} day{days !== 1 ? 's' : ''}
            </Typo>
          )}
          <View style={[s.footerDot, { backgroundColor: colors.border }]} />
          <Typo style={[s.footerMeta, { color: colors.textSecondary }]}>
            #{shortId}
          </Typo>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroWrap: { position: 'relative' },
  hero: { width: '100%', height: 150 },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  codeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  codeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  title: { fontSize: 16, fontWeight: '700' },
  nextPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  nextDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  nextLabel: { fontSize: 13, fontWeight: '700' },
  nextDetail: { fontSize: 12, marginTop: 1 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  footerPrice: { fontSize: 14, fontWeight: '700' },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerMeta: { fontSize: 12, fontWeight: '500' },
  footerDot: { width: 3, height: 3, borderRadius: 1.5 },
});
