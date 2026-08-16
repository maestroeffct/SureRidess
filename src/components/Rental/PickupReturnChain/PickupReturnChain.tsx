/**
 * Two-tap pickup / return confirmation chain — rendered inside
 * Booking Details. Shows a compact horizontal status timeline, then
 * the ONE contextual card that matches the current chain step:
 *
 *   waiting-provider   → "Waiting for provider to mark the car ready"
 *   pickup-code        → 6-digit code + "I received the vehicle" button
 *   in-trip            → "Trip in progress" + "I've returned" button
 *   return-code        → 6-digit return code to show the provider
 *   completed          → success chip
 *
 * The confirm-pickup flow uses a modal that asks the customer to type
 * back the pickup code the provider is looking at — so a wrong car /
 * wrong provider is caught before status flips.
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useTheme } from '@/theme/ThemeProvider';
import Toast from 'react-native-toast-message';
import {
  confirmBookingPickup,
  markBookingReturned,
  type BookingDetails,
} from '@/services/booking.service';

const GREEN = '#0A6A4B';
const AMBER = '#F59E0B';
const RED = '#DC2626';

const STEPS = [
  { key: 'booked', label: 'Booked' },
  { key: 'paid', label: 'Paid' },
  { key: 'ready', label: 'Ready' },
  { key: 'picked-up', label: 'Picked up' },
  { key: 'in-trip', label: 'In trip' },
  { key: 'returned', label: 'Returned' },
  { key: 'completed', label: 'Completed' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];

type Props = {
  booking: BookingDetails;
  onChanged: () => Promise<void> | void;
};

function computeStep(b: BookingDetails): StepKey {
  const chain = b.chain;
  const status = (b.status ?? '').toUpperCase();
  const paymentStatus = (b.payment?.status ?? '').toUpperCase();

  if (status === 'CANCELLED') return 'booked';
  if (status === 'COMPLETED') return 'completed';
  if (chain?.providerConfirmedReturnAt) return 'completed';
  if (chain?.customerMarkedReturnAt) return 'returned';
  if (status === 'IN_TRIP' || chain?.customerConfirmedPickupAt) return 'in-trip';
  if (chain?.providerMarkedReadyAt) return 'ready';
  if (status === 'CONFIRMED' || paymentStatus === 'SUCCEEDED') return 'paid';
  return 'booked';
}

export function PickupReturnChain({ booking, onChanged }: Props) {
  const { colors, mode } = useTheme();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [returnConfirmOpen, setReturnConfirmOpen] = useState(false);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const step = useMemo(() => computeStep(booking), [booking]);
  const chain = booking.chain;

  const activeIndex = STEPS.findIndex(s => s.key === step);
  const isCollection = booking.paymentMethod === 'COLLECTION';

  const onConfirmPickup = async () => {
    if (!/^\d{6}$/.test(code)) {
      Toast.show({ type: 'error', text1: 'Enter the 6-digit pickup code' });
      return;
    }
    try {
      setSubmitting(true);
      await confirmBookingPickup(booking.id, code);
      Toast.show({ type: 'success', text1: 'Pickup confirmed. Trip started.' });
      setConfirmOpen(false);
      setCode('');
      await onChanged();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e?.response?.data?.message ?? 'Could not confirm pickup',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const onMarkReturned = async () => {
    try {
      setSubmitting(true);
      await markBookingReturned(booking.id);
      Toast.show({
        type: 'success',
        text1: 'Return recorded',
        text2: 'Show the return code to the provider to complete.',
      });
      setReturnConfirmOpen(false);
      await onChanged();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: e?.response?.data?.message ?? 'Could not record return',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.wrap}>
      {/* ── Timeline strip ── */}
      <View style={s.timelineHeader}>
        <Icon name="git-branch-outline" size={16} color={GREEN} />
        <Typo style={[s.timelineTitle, { color: colors.textPrimary }]}>
          Trip status
        </Typo>
      </View>
      <View style={[s.timelineRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        {STEPS.map((st, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
          const color = done ? GREEN : current ? GREEN : colors.border;
          return (
            <React.Fragment key={st.key}>
              <View style={s.stepItem}>
                <View
                  style={[
                    s.stepDot,
                    {
                      backgroundColor: done || current ? GREEN : 'transparent',
                      borderColor: color,
                    },
                  ]}
                >
                  {done && <Icon name="checkmark" size={10} color="#fff" />}
                  {current && <View style={s.stepDotInner} />}
                </View>
                <Typo
                  style={[
                    s.stepLabel,
                    {
                      color: done || current ? colors.textPrimary : colors.textSecondary,
                      fontWeight: current ? '800' : '600',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {st.label}
                </Typo>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[s.stepConnector, { backgroundColor: done ? GREEN : colors.border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Contextual card ── */}
      {step === 'paid' && !isCollection && (
        <ChainCard tone="wait" colors={colors}>
          <Icon name="hourglass-outline" size={22} color={AMBER} />
          <Typo style={[s.cardTitle, { color: colors.textPrimary }]}>
            Waiting for the provider
          </Typo>
          <Typo style={[s.cardBody, { color: colors.textSecondary }]}>
            The provider will mark the car ready when it's cleaned, fueled, and
            waiting for you. You'll get a notification the moment it's ready.
          </Typo>
        </ChainCard>
      )}

      {step === 'ready' && chain?.pickupCode && (
        <ChainCard tone="action" colors={colors}>
          <View style={s.codePillWrap}>
            <Typo style={[s.codeLabel, { color: colors.textSecondary }]}>
              YOUR PICKUP CODE
            </Typo>
            <View
              style={[
                s.codePill,
                {
                  backgroundColor: mode === 'dark' ? '#0F3027' : '#F0FDF4',
                  borderColor: GREEN,
                },
              ]}
            >
              <Typo style={[s.codeText, { color: GREEN }]}>
                {chain.pickupCode.replace(/(\d{3})(\d{3})/, '$1 $2')}
              </Typo>
            </View>
          </View>
          <Typo style={[s.cardBody, { color: colors.textSecondary, textAlign: 'center' }]}>
            The provider has the car ready. Show this code, then confirm when
            you actually have the keys in hand.
          </Typo>
          <AppButton
            title="I received the vehicle"
            onPress={() => setConfirmOpen(true)}
          />
        </ChainCard>
      )}

      {step === 'in-trip' && (
        <ChainCard tone="live" colors={colors}>
          <View style={s.liveHeader}>
            <View style={s.liveDot} />
            <Typo style={[s.cardTitle, { color: colors.textPrimary }]}>
              Trip in progress
            </Typo>
          </View>
          <Typo style={[s.cardBody, { color: colors.textSecondary }]}>
            Return the car to the provider on time. When you're back, tap the
            button below so the provider can inspect and close the trip.
          </Typo>
          <AppButton
            title="I've returned the vehicle"
            onPress={() => setReturnConfirmOpen(true)}
          />
        </ChainCard>
      )}

      {step === 'returned' && chain?.returnCode && (
        <ChainCard tone="action" colors={colors}>
          <View style={s.codePillWrap}>
            <Typo style={[s.codeLabel, { color: colors.textSecondary }]}>
              RETURN CODE — SHOW TO PROVIDER
            </Typo>
            <View
              style={[
                s.codePill,
                {
                  backgroundColor: mode === 'dark' ? '#3A2A08' : '#FEF3C7',
                  borderColor: AMBER,
                },
              ]}
            >
              <Typo style={[s.codeText, { color: AMBER }]}>
                {chain.returnCode.replace(/(\d{3})(\d{3})/, '$1 $2')}
              </Typo>
            </View>
          </View>
          <Typo style={[s.cardBody, { color: colors.textSecondary, textAlign: 'center' }]}>
            The provider enters this code to confirm they've received the car
            back in good condition. The trip closes once they do.
          </Typo>
        </ChainCard>
      )}

      {step === 'completed' && (
        <ChainCard tone="done" colors={colors}>
          <Icon name="checkmark-circle" size={28} color={GREEN} />
          <Typo style={[s.cardTitle, { color: colors.textPrimary }]}>
            Trip completed
          </Typo>
          <Typo style={[s.cardBody, { color: colors.textSecondary, textAlign: 'center' }]}>
            Thanks for renting with us. Your security deposit is being
            released, and a receipt will land in your inbox shortly.
          </Typo>
        </ChainCard>
      )}

      {/* ── Confirm pickup modal ── */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={s.backdrop}>
          <View style={[s.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[s.modalIcon, { backgroundColor: mode === 'dark' ? '#0F3027' : '#F0FDF4' }]}>
              <Icon name="key-outline" size={24} color={GREEN} />
            </View>
            <Typo style={[s.modalTitle, { color: colors.textPrimary }]}>
              Confirm pickup
            </Typo>
            <Typo style={[s.modalHint, { color: colors.textSecondary }]}>
              Enter the 6-digit code shown above to confirm you have the
              vehicle. Do this only when the car is with you.
            </Typo>
            <TextInput
              value={code}
              onChangeText={t => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={[
                s.codeInput,
                {
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              maxLength={6}
            />
            <View style={s.modalRow}>
              <TouchableOpacity
                style={[s.modalBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                <Typo style={{ color: colors.textPrimary, fontWeight: '700' }}>Cancel</Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: GREEN, borderColor: GREEN, flex: 1 }]}
                onPress={onConfirmPickup}
                disabled={submitting || code.length !== 6}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Typo style={{ color: '#fff', fontWeight: '800' }}>Confirm pickup</Typo>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Confirm return modal ── */}
      <Modal visible={returnConfirmOpen} transparent animationType="fade" onRequestClose={() => setReturnConfirmOpen(false)}>
        <View style={s.backdrop}>
          <View style={[s.modalCard, { backgroundColor: colors.surface }]}>
            <View style={[s.modalIcon, { backgroundColor: mode === 'dark' ? '#3A2A08' : '#FEF3C7' }]}>
              <Icon name="return-down-back-outline" size={24} color={AMBER} />
            </View>
            <Typo style={[s.modalTitle, { color: colors.textPrimary }]}>
              Mark vehicle as returned?
            </Typo>
            <Typo style={[s.modalHint, { color: colors.textSecondary }]}>
              Only do this when the car is physically with the provider. You'll
              get a 6-digit code to give them so they can close out the trip.
            </Typo>
            <View style={s.modalRow}>
              <TouchableOpacity
                style={[s.modalBtn, { borderColor: colors.border }]}
                onPress={() => setReturnConfirmOpen(false)}
                disabled={submitting}
              >
                <Typo style={{ color: colors.textPrimary, fontWeight: '700' }}>Not yet</Typo>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: AMBER, borderColor: AMBER, flex: 1 }]}
                onPress={onMarkReturned}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Typo style={{ color: '#fff', fontWeight: '800' }}>Yes, returned</Typo>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ChainCard({
  tone,
  colors,
  children,
}: {
  tone: 'wait' | 'action' | 'live' | 'done';
  colors: any;
  children: React.ReactNode;
}) {
  const border =
    tone === 'wait' ? AMBER : tone === 'live' ? GREEN : tone === 'action' ? GREEN : GREEN;
  return (
    <View
      style={[
        s.card,
        {
          borderColor: border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
  },
  timelineTitle: { fontSize: 15, fontWeight: '800' },

  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  stepItem: { alignItems: 'center', gap: 4, flexShrink: 1, maxWidth: 60 },
  stepDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  stepLabel: { fontSize: 9, letterSpacing: 0.2 },
  stepConnector: { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 2 },

  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 18,
    gap: 10,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800' },
  cardBody: { fontSize: 13, lineHeight: 19 },

  codePillWrap: { alignItems: 'center', gap: 8, marginBottom: 4 },
  codeLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  codePill: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  codeText: { fontSize: 34, fontWeight: '900', letterSpacing: 6 },

  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: RED,
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalHint: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  codeInput: {
    width: '100%',
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
  },
  modalRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  modalBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});
