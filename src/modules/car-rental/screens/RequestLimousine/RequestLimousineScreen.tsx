/**
 * Request a Limousine — concierge form opened from the in-app limousine
 * tile. Submits to /limousine-requests; admin matches a provider
 * manually via the dashboard's Limousine Requests queue.
 */

import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast from 'react-native-toast-message';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { submitLimousineRequest } from '@/services/limousine.service';

const GREEN = '#0A6A4B';
const GREEN_DARK = '#064030';
const GOLD = '#D4AF37';

type FormState = {
  customerName: string;
  contactEmail: string;
  contactPhone: string;
  pickupAt: Date | null;
  pickupLocation: string;
  dropoffLocation: string;
  passengerCount: string;
  eventType: string;
  notes: string;
};

const EVENT_TYPES: Array<{
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  { label: 'Airport pickup', icon: 'airplane-outline' },
  { label: 'Wedding', icon: 'heart-outline' },
  { label: 'Corporate event', icon: 'briefcase-outline' },
  { label: 'Birthday', icon: 'gift-outline' },
  { label: 'Prom / Graduation', icon: 'school-outline' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
function formatTime(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function RequestLimousineScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors, mode } = useTheme();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    customerName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    contactEmail: user?.email ?? '',
    contactPhone: `${user?.phoneCountry ?? ''}${user?.phoneNumber ?? ''}`.trim(),
    pickupAt: null,
    pickupLocation: '',
    dropoffLocation: '',
    passengerCount: '1',
    eventType: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const passengerNum = useMemo(
    () => Math.max(1, Math.min(20, Number(form.passengerCount) || 1)),
    [form.passengerCount],
  );

  const validate = (): string | null => {
    if (!form.customerName.trim()) return 'Please enter your name';
    if (!form.contactEmail.includes('@')) return 'Enter a valid email';
    if (form.contactPhone.replace(/\D/g, '').length < 7)
      return 'Enter a valid phone';
    if (!form.pickupAt) return 'Pick a pickup date and time';
    if (form.pickupAt.getTime() < Date.now() - 60 * 1000)
      return 'Pickup time must be in the future';
    if (!form.pickupLocation.trim()) return 'Please enter pickup location';
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      Toast.show({ type: 'error', text1: err });
      return;
    }
    const pickupAt = form.pickupAt as Date;
    try {
      setSubmitting(true);
      await submitLimousineRequest({
        customerName: form.customerName.trim(),
        contactEmail: form.contactEmail.trim().toLowerCase(),
        contactPhone: form.contactPhone.trim(),
        pickupDate: `${pickupAt.getFullYear()}-${pad(pickupAt.getMonth() + 1)}-${pad(pickupAt.getDate())}`,
        pickupTime: formatTime(pickupAt),
        pickupLocation: form.pickupLocation.trim(),
        dropoffLocation: form.dropoffLocation.trim() || undefined,
        passengerCount: passengerNum,
        eventType: form.eventType || undefined,
        notes: form.notes.trim() || undefined,
      });
      Toast.show({
        type: 'success',
        text1: 'Request received',
        text2: 'Our team will reach out shortly.',
      });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({
        type: 'error',
        text1: 'Could not submit',
        text2: e?.response?.data?.message ?? 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDateChange = (_: unknown, selected?: Date) => {
    if (!selected) {
      setPickerMode(null);
      return;
    }
    const base = form.pickupAt ?? new Date();
    if (pickerMode === 'date') {
      const merged = new Date(base);
      merged.setFullYear(selected.getFullYear());
      merged.setMonth(selected.getMonth());
      merged.setDate(selected.getDate());
      set('pickupAt', merged);
    } else {
      const merged = new Date(base);
      merged.setHours(selected.getHours());
      merged.setMinutes(selected.getMinutes());
      set('pickupAt', merged);
    }
    setPickerMode(null);
  };

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── HERO ── */}
      <View style={[s.hero, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={[GREEN_DARK, GREEN]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.heroTopBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={s.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={[s.tierChip, { borderColor: `${GOLD}66` }]}>
            <View style={[s.tierDot, { backgroundColor: GOLD }]} />
            <Typo style={s.tierChipText}>Concierge</Typo>
          </View>
        </View>

        <View style={s.heroBody}>
          <View style={[s.heroIcon, { backgroundColor: 'rgba(212,175,55,0.15)' }]}>
            <Ionicons name="car-sport" size={30} color={GOLD} />
          </View>
          <Typo style={s.heroTitle}>Request a Limousine</Typo>
          <Typo style={s.heroSubtitle}>
            Chauffeur service for airports, weddings, corporate events, and
            special occasions. Our concierge team confirms availability and
            pricing within a few hours.
          </Typo>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 120,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── CONTACT ── */}
          <SectionHeader icon="person-outline" title="Contact details" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppInput
              label="Full name"
              value={form.customerName}
              onChangeText={t => set('customerName', t)}
              placeholder="Your name"
            />
            <AppInput
              label="Email"
              value={form.contactEmail}
              onChangeText={t => set('contactEmail', t)}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppInput
              label="Phone"
              value={form.contactPhone}
              onChangeText={t => set('contactPhone', t)}
              placeholder="+234..."
              keyboardType="phone-pad"
            />
          </View>

          {/* ── TRIP ── */}
          <SectionHeader icon="location-outline" title="Trip details" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Date + time row */}
            <View style={s.row2}>
              <PickerField
                icon="calendar-outline"
                label="Pickup date"
                value={form.pickupAt ? formatDate(form.pickupAt) : ''}
                placeholder="Select date"
                onPress={() => setPickerMode('date')}
                colors={colors}
              />
              <PickerField
                icon="time-outline"
                label="Pickup time"
                value={form.pickupAt ? formatTime(form.pickupAt) : ''}
                placeholder="—"
                onPress={() =>
                  form.pickupAt
                    ? setPickerMode('time')
                    : Toast.show({ type: 'info', text1: 'Pick a date first' })
                }
                colors={colors}
              />
            </View>

            <AppInput
              label="Pickup location"
              value={form.pickupLocation}
              onChangeText={t => set('pickupLocation', t)}
              placeholder="Address, hotel, or landmark"
              leftIcon={<Ionicons name="pin-outline" size={18} color={colors.textSecondary} />}
            />
            <AppInput
              label="Drop-off location (optional)"
              value={form.dropoffLocation}
              onChangeText={t => set('dropoffLocation', t)}
              placeholder="Address or venue"
              leftIcon={<Ionicons name="flag-outline" size={18} color={colors.textSecondary} />}
            />

            {/* Passengers stepper */}
            <View style={{ marginTop: 6 }}>
              <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>
                Number of passengers
              </Typo>
              <View style={[s.stepper, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <TouchableOpacity
                  onPress={() => set('passengerCount', String(Math.max(1, passengerNum - 1)))}
                  style={s.stepperBtn}
                  hitSlop={8}
                >
                  <Ionicons name="remove" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <View style={s.stepperValueWrap}>
                  <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                  <Typo style={[s.stepperValue, { color: colors.textPrimary }]}>{passengerNum}</Typo>
                </View>
                <TouchableOpacity
                  onPress={() => set('passengerCount', String(Math.min(20, passengerNum + 1)))}
                  style={s.stepperBtn}
                  hitSlop={8}
                >
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── OCCASION ── */}
          <SectionHeader icon="sparkles-outline" title="Occasion (optional)" colors={colors} />
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.chipsRow}>
              {EVENT_TYPES.map(opt => {
                const active = form.eventType === opt.label;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => set('eventType', active ? '' : opt.label)}
                    style={[
                      s.chip,
                      {
                        borderColor: active ? GREEN : colors.border,
                        backgroundColor: active
                          ? mode === 'dark'
                            ? 'rgba(10,106,75,0.25)'
                            : '#E7F5F0'
                          : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={14}
                      color={active ? GREEN : colors.textSecondary}
                    />
                    <Typo
                      style={[
                        s.chipText,
                        { color: active ? GREEN : colors.textPrimary, fontWeight: active ? '700' : '500' },
                      ]}
                    >
                      {opt.label}
                    </Typo>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ marginTop: 16 }}>
              <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>
                Anything else we should know?
              </Typo>
              <TextInput
                style={[
                  s.notesInput,
                  {
                    color: colors.textPrimary,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                value={form.notes}
                onChangeText={t => set('notes', t)}
                placeholder="Preferred vehicle style, event dress code, luggage, VIP requirements…"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* ── HOW IT WORKS ── */}
          <View
            style={[
              s.infoCard,
              {
                backgroundColor: mode === 'dark' ? 'rgba(212,175,55,0.08)' : '#FEF7E0',
                borderColor: `${GOLD}55`,
              },
            ]}
          >
            <Ionicons name="information-circle" size={16} color={GOLD} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Typo style={[s.infoTitle, { color: mode === 'dark' ? '#F5D373' : '#7C5E00' }]}>
                What happens next
              </Typo>
              <Typo style={[s.infoText, { color: colors.textSecondary }]}>
                Your request goes to our concierge queue. A team member
                confirms vehicle availability, final pricing, and payment
                details by call or WhatsApp within a few hours.
              </Typo>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── BOTTOM BAR ── */}
      <View
        style={[
          s.footer,
          {
            paddingBottom: insets.bottom + 12,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
        ]}
      >
        <AppButton
          title={submitting ? 'Sending…' : 'Send Request'}
          onPress={onSubmit}
          loading={submitting}
        />
      </View>

      {pickerMode && (
        <DateTimePicker
          value={form.pickupAt ?? new Date(Date.now() + 60 * 60 * 1000)}
          mode={pickerMode}
          minimumDate={pickerMode === 'date' ? new Date() : undefined}
          onChange={handleDateChange}
        />
      )}
    </View>
  );
}

/* ── local helpers ─────────────────────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  colors: any;
}) {
  return (
    <View style={s.sectionHead}>
      <Ionicons name={icon} size={16} color={GREEN} />
      <Typo style={[s.sectionTitle, { color: colors.textPrimary }]}>{title}</Typo>
    </View>
  );
}

function PickerField({
  icon,
  label,
  value,
  placeholder,
  onPress,
  colors,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>{label}</Typo>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[s.pickerField, { borderColor: colors.border, backgroundColor: colors.background }]}
      >
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
        <Typo
          style={{
            flex: 1,
            color: value ? colors.textPrimary : colors.textSecondary,
            fontSize: 14,
          }}
          numberOfLines={1}
        >
          {value || placeholder}
        </Typo>
        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

/* ── styles ───────────────────────────────────────────────────────── */

const s = StyleSheet.create({
  root: { flex: 1 },

  hero: {
    paddingBottom: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  heroTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  tierDot: { width: 6, height: 6, borderRadius: 3 },
  tierChipText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  heroBody: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 8, gap: 8 },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', letterSpacing: 0.1 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },

  row2: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  pickerField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    overflow: 'hidden',
  },
  stepperBtn: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center' },
  stepperValueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stepperValue: { fontSize: 15, fontWeight: '700' },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5 },

  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 96,
    textAlignVertical: 'top',
  },

  infoCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
  infoTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  infoText: { fontSize: 12, marginTop: 3, lineHeight: 17 },

  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
