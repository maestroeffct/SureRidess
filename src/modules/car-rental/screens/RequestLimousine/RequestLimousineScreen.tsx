/**
 * Request a Limousine — concierge form opened from the in-app limousine
 * banner. Submits to /limousine-requests; admin matches a provider manually
 * via the dashboard's Limousine Requests queue.
 */

import React, { useState } from 'react';
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
import Toast from 'react-native-toast-message';

import { Typo } from '@/components/AppText/Typo';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/theme/ThemeProvider';
import { submitLimousineRequest } from '@/services/limousine.service';

const GREEN = '#0A6A4B';

type FormState = {
  customerName: string;
  contactEmail: string;
  contactPhone: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM
  pickupLocation: string;
  dropoffLocation: string;
  passengerCount: string;
  eventType: string;
  notes: string;
};

const EVENT_TYPES = [
  'Airport pickup',
  'Wedding',
  'Corporate event',
  'Birthday',
  'Prom / Graduation',
  'Other',
];

export default function RequestLimousineScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>({
    customerName: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
    contactEmail: user?.email ?? '',
    contactPhone: `${user?.phoneCountry ?? ''}${user?.phoneNumber ?? ''}`.trim(),
    pickupDate: '',
    pickupTime: '',
    pickupLocation: '',
    dropoffLocation: '',
    passengerCount: '1',
    eventType: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const validate = (): string | null => {
    if (!form.customerName.trim()) return 'Please enter your name';
    if (!form.contactEmail.includes('@')) return 'Enter a valid email';
    if (form.contactPhone.replace(/\D/g, '').length < 7)
      return 'Enter a valid phone';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.pickupDate))
      return 'Pickup date format must be YYYY-MM-DD';
    if (!/^\d{1,2}:\d{2}$/.test(form.pickupTime))
      return 'Pickup time format must be HH:MM (24h)';
    if (!form.pickupLocation.trim()) return 'Please enter pickup location';
    const passengers = Number(form.passengerCount);
    if (!Number.isFinite(passengers) || passengers < 1)
      return 'Passenger count must be at least 1';
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      Toast.show({ type: 'error', text1: err });
      return;
    }
    try {
      setSubmitting(true);
      await submitLimousineRequest({
        customerName: form.customerName.trim(),
        contactEmail: form.contactEmail.trim().toLowerCase(),
        contactPhone: form.contactPhone.trim(),
        pickupDate: form.pickupDate,
        pickupTime: form.pickupTime,
        pickupLocation: form.pickupLocation.trim(),
        dropoffLocation: form.dropoffLocation.trim() || undefined,
        passengerCount: Number(form.passengerCount),
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

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      <View style={[s.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Ionicons name="car-sport" size={18} color={GREEN} />
          <Typo style={[s.headerTitle, { color: colors.textPrimary }]}>
            Request a Limousine
          </Typo>
        </View>
        <View style={{ width: 26 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 18,
            paddingBottom: insets.bottom + 100,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Typo style={[s.intro, { color: colors.textSecondary }]}>
            Tell us a bit about your trip and we&rsquo;ll match you with a
            provider. Our team will contact you within a few hours to confirm
            availability and final pricing.
          </Typo>

          <Section title="Contact details" colors={colors}>
            <Field label="Full name" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.customerName}
                onChangeText={t => set('customerName', t)}
                placeholder="Your name"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
            <Field label="Email" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.contactEmail}
                onChangeText={t => set('contactEmail', t)}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
            <Field label="Phone" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.contactPhone}
                onChangeText={t => set('contactPhone', t)}
                placeholder="+234..."
                keyboardType="phone-pad"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
          </Section>

          <Section title="Trip details" colors={colors}>
            <Field label="Pickup date (YYYY-MM-DD)" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.pickupDate}
                onChangeText={t => set('pickupDate', t)}
                placeholder="2026-07-12"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
            <Field label="Pickup time (24h)" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.pickupTime}
                onChangeText={t => set('pickupTime', t)}
                placeholder="14:30"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
            <Field label="Pickup location" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.pickupLocation}
                onChangeText={t => set('pickupLocation', t)}
                placeholder="Address or landmark"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
            <Field label="Drop-off location (optional)" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.dropoffLocation}
                onChangeText={t => set('dropoffLocation', t)}
                placeholder="Address or venue"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
            <Field label="Number of passengers" colors={colors}>
              <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={form.passengerCount}
                onChangeText={t =>
                  set('passengerCount', t.replace(/[^0-9]/g, ''))
                }
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor={colors.textSecondary}
              />
            </Field>
          </Section>

          <Section title="Occasion (optional)" colors={colors}>
            <View style={s.chipsRow}>
              {EVENT_TYPES.map(opt => {
                const active = form.eventType === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => set('eventType', active ? '' : opt)}
                    style={[
                      s.chip,
                      {
                        borderColor: active ? GREEN : colors.border,
                        backgroundColor: active ? `${GREEN}22` : 'transparent',
                      },
                    ]}
                  >
                    <Typo
                      style={[
                        s.chipText,
                        { color: active ? GREEN : colors.textSecondary },
                      ]}
                    >
                      {opt}
                    </Typo>
                  </Pressable>
                );
              })}
            </View>
            <Field label="Anything else we should know?" colors={colors}>
              <TextInput
                style={[
                  s.input,
                  { color: colors.textPrimary, minHeight: 90, textAlignVertical: 'top' },
                ]}
                value={form.notes}
                onChangeText={t => set('notes', t)}
                placeholder="Optional notes for the provider"
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </Field>
          </Section>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          s.footer,
          { paddingBottom: insets.bottom + 12, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSubmit}
          disabled={submitting}
          style={[s.cta, { opacity: submitting ? 0.55 : 1 }]}
        >
          <Ionicons name="paper-plane" size={16} color="#fff" />
          <Typo style={s.ctaText}>
            {submitting ? 'Sending…' : 'Send request'}
          </Typo>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={s.section}>
      <Typo style={[s.sectionTitle, { color: colors.textPrimary }]}>
        {title}
      </Typo>
      <View
        style={[
          s.sectionBody,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Field({
  label,
  children,
  colors,
}: {
  label: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={s.field}>
      <Typo style={[s.fieldLabel, { color: colors.textSecondary }]}>
        {label}
      </Typo>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  intro: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sectionBody: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cta: {
    backgroundColor: GREEN,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
