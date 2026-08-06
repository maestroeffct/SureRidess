import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { Typo } from '@/components/AppText/Typo';
import { useAuth } from '@/providers/AuthProvider';
import { getItem, setItem } from '@/helpers/storage';

/**
 * Persistent yellow banner that nudges customers to finish KYC before
 * checkout. Rendered at the top of every main-tab screen. Dismiss
 * snoozes for 24 hrs, not forever — the customer will see it again
 * next day if still unverified.
 */

const SNOOZE_KEY = 'kyc_banner_snoozed_until';
const SNOOZE_MS = 24 * 60 * 60 * 1000;

const VERIFIED_STATES = new Set(['APPROVED', 'VERIFIED', 'COMPLETED']);
const PENDING_STATES = new Set([
  'PENDING',
  'PENDING_VERIFICATION',
  'SUBMITTED',
  'IN_REVIEW',
]);

type BannerState =
  | { kind: 'hidden' }
  | { kind: 'unverified' }
  | { kind: 'pending' }
  | { kind: 'rejected' };

function statusFromUser(user: { kycStatus?: string; profileStatus?: string } | null): BannerState {
  if (!user) return { kind: 'hidden' };
  const raw = (user.profileStatus || user.kycStatus || '').toUpperCase();
  if (VERIFIED_STATES.has(raw)) return { kind: 'hidden' };
  if (raw === 'REJECTED' || raw === 'DECLINED' || raw === 'FAILED')
    return { kind: 'rejected' };
  if (PENDING_STATES.has(raw)) return { kind: 'pending' };
  return { kind: 'unverified' };
}

export const KycBanner = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [snoozed, setSnoozed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const until = Number(await getItem(SNOOZE_KEY as any));
      setSnoozed(Number.isFinite(until) && until > Date.now());
    })();
  }, []);

  const state = statusFromUser(user);
  // Rejected banner can't be snoozed — it's blocking and needs action.
  if (state.kind === 'hidden') return null;
  if (state.kind !== 'rejected' && snoozed) return null;

  const dismiss = async () => {
    await setItem(SNOOZE_KEY as any, String(Date.now() + SNOOZE_MS));
    setSnoozed(true);
  };

  const openKyc = () =>
    navigation.navigate('KYCFlow' as any);

  const palette = {
    unverified: {
      bg: '#FEF3C7',
      border: '#F59E0B',
      accent: '#B45309',
      title: '#7C2D12',
      body: '#92400E',
      icon: 'alert-circle' as const,
      title_: 'Verify your identity to book',
      body_: 'Add your documents so you can complete a booking. Takes about 2 minutes.',
      cta: 'Verify now',
    },
    pending: {
      bg: '#DBEAFE',
      border: '#3B82F6',
      accent: '#1D4ED8',
      title: '#1E3A8A',
      body: '#1E40AF',
      icon: 'time-outline' as const,
      title_: 'Verification in review',
      body_: 'Your KYC is being checked. You can browse — booking unlocks once approved.',
      cta: 'View status',
    },
    rejected: {
      bg: '#FEE2E2',
      border: '#EF4444',
      accent: '#B91C1C',
      title: '#7F1D1D',
      body: '#991B1B',
      icon: 'close-circle' as const,
      title_: 'KYC was rejected',
      body_: 'Re-upload your documents to unlock booking.',
      cta: 'Re-upload',
    },
  }[state.kind];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={openKyc}
      style={[s.wrap, { backgroundColor: palette.bg, borderColor: palette.border }]}
    >
      <Icon name={palette.icon} size={22} color={palette.accent} />
      <View style={{ flex: 1 }}>
        <Typo style={[s.title, { color: palette.title }]}>{palette.title_}</Typo>
        <Typo style={[s.body, { color: palette.body }]}>{palette.body_}</Typo>
      </View>
      <View style={[s.cta, { backgroundColor: palette.accent }]}>
        <Typo style={s.ctaText}>{palette.cta}</Typo>
        <Icon name="arrow-forward" size={13} color="#fff" />
      </View>
      {state.kind !== 'rejected' && (
        <TouchableOpacity onPress={dismiss} style={s.close} hitSlop={8}>
          <Icon name="close" size={16} color={palette.accent} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 12, marginTop: 2 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  ctaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  close: {
    paddingLeft: 4,
  },
});
