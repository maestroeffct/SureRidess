import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';

/**
 * Landing screen for the KYC flow. Branches on the user's current KYC
 * status so tapping "Verify" from the banner doesn't drop the customer
 * back into a fresh docs upload while their previous submission is
 * still being reviewed.
 *
 *   NOT_STARTED / INCOMPLETE  → "Start verification" → PersonalInfo
 *   PENDING / SUBMITTED       → "In review" — refresh button, no CTA to re-submit
 *   REJECTED                  → show reason + "Re-upload documents" → PersonalInfo
 *   VERIFIED                  → success + "Continue"
 */
export default function KycStatusScreen() {
  const navigation = useNavigation<any>();
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const rawStatus = (
    user?.profileStatus ||
    user?.kycStatus ||
    ''
  ).toString().toUpperCase();

  const state: 'verified' | 'pending' | 'rejected' | 'start' = (() => {
    if (['APPROVED', 'VERIFIED', 'COMPLETED'].includes(rawStatus)) return 'verified';
    if (['PENDING', 'PENDING_VERIFICATION', 'SUBMITTED', 'IN_REVIEW'].includes(rawStatus)) return 'pending';
    if (['REJECTED', 'DECLINED', 'FAILED'].includes(rawStatus)) return 'rejected';
    return 'start';
  })();

  const goStart = () => navigation.navigate('PersonalInfo' as any);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshUser();
      showSuccess('Status updated');
    } catch {
      showError('Could not refresh — check your connection');
    } finally {
      setRefreshing(false);
    }
  };

  const config = {
    start: {
      icon: 'shield-outline' as const,
      color: '#0A6A4B',
      bg: '#E7F5F0',
      title: 'Verify your identity',
      subtitle:
        "Upload your ID, address and a driver's license to unlock booking. It takes about 2 minutes.",
      primary: { label: 'Start verification', onPress: goStart },
      secondary: null,
    },
    pending: {
      icon: 'time-outline' as const,
      color: '#0369A1',
      bg: '#DBEAFE',
      title: 'Verification in review',
      subtitle:
        "Your documents have been submitted and are being reviewed. This usually takes under 24 hours — we'll notify you the moment it's approved.",
      primary: {
        label: refreshing ? 'Checking…' : 'Check status again',
        onPress: handleRefresh,
      },
      secondary: null,
    },
    rejected: {
      icon: 'close-circle-outline' as const,
      color: '#B91C1C',
      bg: '#FEE2E2',
      title: 'Verification rejected',
      subtitle:
        (user as any)?.kyc?.rejectionReason ||
        'Some of your documents could not be verified. Please re-upload with clear, unedited photos.',
      primary: { label: 'Re-upload documents', onPress: goStart },
      secondary: null,
    },
    verified: {
      icon: 'checkmark-circle' as const,
      color: '#0A6A4B',
      bg: '#DCFCE7',
      title: 'You are verified',
      subtitle: 'Your identity has been approved. You can book any car on SureRide.',
      primary: { label: 'Continue', onPress: () => navigation.goBack() },
      secondary: null,
    },
  }[state];

  return (
    <ScreenWrapper>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Icon name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Typo variant="subheading">Verification</Typo>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0A6A4B']}
          />
        }
      >
        <View style={[s.iconWrap, { backgroundColor: config.bg }]}>
          {refreshing && state === 'pending' ? (
            <ActivityIndicator size="large" color={config.color} />
          ) : (
            <Icon name={config.icon} size={44} color={config.color} />
          )}
        </View>

        <Typo style={[s.title, { color: colors.textPrimary }]}>{config.title}</Typo>
        <Typo style={[s.subtitle, { color: colors.textSecondary }]}>{config.subtitle}</Typo>

        {state === 'pending' && (
          <View style={s.metaBox}>
            <Icon name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Typo style={[s.metaText, { color: colors.textSecondary }]}>
              You will get a push notification and an email when a decision is made.
              Pull down to check again.
            </Typo>
          </View>
        )}

        <View style={s.ctaWrap}>
          <AppButton
            title={config.primary.label}
            onPress={config.primary.onPress}
            loading={refreshing && state === 'pending'}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  body: {
    // ScrollView contentContainerStyle — flexGrow so it fills the
    // viewport when content is short (needed for pull-to-refresh to
    // register on tall screens).
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 32,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 12,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(148,163,184,0.10)',
  },
  metaText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
  },
  ctaWrap: {
    width: '100%',
    marginTop: 32,
  },
});
