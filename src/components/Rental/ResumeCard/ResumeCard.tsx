/**
 * "Continue where you left off" card for the Home screen.
 *
 * Reads the current CHECKOUT draft on mount + on focus, and shows a
 * dismissible tile that deep-links back into PaymentScreen with the
 * saved car / dates / selections. The card renders nothing when no
 * live draft exists, so it doesn't take up space on a clean Home.
 *
 * Uses useFocusEffect (not just useEffect) so the card wakes up when
 * the user backs out of PaymentScreen without completing — the draft
 * would have just been saved by the debounced writer.
 */

import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import { clearDraft, loadDraft, type CheckoutDraft } from '@/services/drafts.service';

const BRAND = '#0A6A4B';
const AMBER = '#F59E0B';

export function ResumeCard() {
  const navigation = useNavigation<any>();
  const { colors, mode } = useTheme();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const d = await loadDraft<CheckoutDraft>('checkout');
        if (alive) setDraft(d);
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  if (!draft) return null;

  const resume = () => {
    navigation.navigate('CarRentalFlowNavigator', {
      screen: 'PaymentScreen',
      params: {
        vehicleId: draft.carId,
        search: {
          pickupAt: draft.pickupAt,
          returnAt: draft.returnAt,
          pickupLocationId: draft.pickupLocationId,
          dropoffLocationId: draft.dropoffLocationId,
        },
        pickupLocationName: draft.pickupLocationName,
        insuranceId: draft.insuranceId ?? undefined,
        pickupLocationId: draft.pickupLocationId,
        dropoffLocationId: draft.dropoffLocationId,
        paymentMethod: draft.paymentMethod ?? 'ONLINE',
        bookingId: draft.bookingId,
      },
    });
  };

  const dismiss = async () => {
    setDraft(null);
    await clearDraft('checkout');
  };

  const days = Math.max(
    1,
    Math.ceil(
      (new Date(draft.returnAt).getTime() - new Date(draft.pickupAt).getTime()) /
        86400000,
    ),
  );

  return (
    <View
      style={[
        s.wrap,
        {
          backgroundColor: colors.surface,
          borderColor: `${AMBER}55`,
        },
      ]}
    >
      {draft.carImage ? (
        <Image source={{ uri: draft.carImage }} style={s.thumb} />
      ) : (
        <View style={[s.thumb, { backgroundColor: mode === 'dark' ? '#0F172A' : '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
          <Icon name="car-sport-outline" size={22} color={colors.textSecondary} />
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={s.pillRow}>
          <View style={[s.pill, { backgroundColor: `${AMBER}22` }]}>
            <Icon name="time-outline" size={10} color={AMBER} />
            <Typo style={[s.pillText, { color: AMBER }]}>PICK UP WHERE YOU LEFT OFF</Typo>
          </View>
        </View>
        <Typo style={[s.title, { color: colors.textPrimary }]} numberOfLines={1}>
          {draft.carName}
        </Typo>
        <Typo style={[s.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          {days} day{days > 1 ? 's' : ''}
          {draft.pickupLocationName ? ` · ${draft.pickupLocationName}` : ''}
        </Typo>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={resume}
          style={[s.cta, { backgroundColor: BRAND }]}
        >
          <Typo style={s.ctaText}>
            {draft.step === 'PAYMENT' ? 'Complete payment' : 'Continue checkout'}
          </Typo>
          <Icon name="arrow-forward" size={13} color="#fff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={dismiss} hitSlop={10} style={s.close}>
        <Icon name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#111',
  },
  pillRow: { flexDirection: 'row' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  title: { fontSize: 14, fontWeight: '800' },
  sub: { fontSize: 11 },
  cta: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  ctaText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  close: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
