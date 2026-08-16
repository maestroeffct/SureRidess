/**
 * Post-trip review — two ratings in one modal. The customer scores
 * the CAR (required) and, optionally, the PROVIDER (customer service,
 * pickup punctuality, condition-vs-listing). Both drop into the same
 * Review row on the backend; providerRating is nullable so a customer
 * who only wants to rate the car can still submit.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { StarRating } from '@/components/StarRating/StarRating';
import { useTheme } from '@/theme/ThemeProvider';
import { submitCarReview } from '@/services/review.service';
import { showError, showSuccess } from '@/helpers/toast';

const BRAND = '#0A6A4B';

type Props = {
  visible: boolean;
  carId: string;
  bookingId: string;
  carTitle?: string;
  providerName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

const RATING_LABELS: Record<number, string> = {
  0: 'Tap a star to rate',
  1: 'Poor',
  2: 'Below average',
  3: 'Good',
  4: 'Very good',
  5: 'Excellent',
};

const MAX_COMMENT = 1000;

export function WriteReviewModal({
  visible,
  carId,
  bookingId,
  carTitle,
  providerName,
  onClose,
  onSubmitted,
}: Props) {
  const { colors, mode } = useTheme();
  const [carRating, setCarRating] = useState(0);
  const [carComment, setCarComment] = useState('');
  const [providerRating, setProviderRating] = useState(0);
  const [providerComment, setProviderComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setCarRating(0);
      setCarComment('');
      setProviderRating(0);
      setProviderComment('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (carRating < 1) {
      showError('Please rate the car');
      return;
    }
    try {
      setSubmitting(true);
      await submitCarReview(carId, {
        bookingId,
        rating: carRating,
        comment: carComment.trim() || undefined,
        providerRating: providerRating >= 1 ? providerRating : undefined,
        providerComment: providerComment.trim() || undefined,
      });
      showSuccess('Thanks for your review');
      onSubmitted?.();
      onClose();
    } catch (e: any) {
      showError(e?.response?.data?.message || 'Unable to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      hardwareAccelerated
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[s.card, { backgroundColor: colors.surface }]}>
              {/* Header */}
              <View style={s.header}>
                <View style={{ flex: 1 }}>
                  <Typo style={[s.title, { color: colors.textPrimary }]}>
                    Rate your trip
                  </Typo>
                  <Typo style={[s.subtitle, { color: colors.textSecondary }]}>
                    Your feedback helps the next renter choose well.
                  </Typo>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 480 }}
                contentContainerStyle={{ gap: 18, paddingBottom: 4 }}
              >
                {/* ── CAR RATING (required) ── */}
                <View style={[s.section, { borderColor: colors.border, backgroundColor: mode === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                  <View style={s.sectionHead}>
                    <Icon name="car-sport" size={16} color={BRAND} />
                    <View style={{ flex: 1 }}>
                      <Typo style={[s.sectionTitle, { color: colors.textPrimary }]}>
                        The car
                      </Typo>
                      {carTitle && (
                        <Typo style={[s.sectionSub, { color: colors.textSecondary }]}>
                          {carTitle}
                        </Typo>
                      )}
                    </View>
                    <Typo style={[s.reqBadge, { color: BRAND }]}>REQUIRED</Typo>
                  </View>
                  <View style={s.starsBlock}>
                    <StarRating value={carRating} size={30} gap={6} onChange={setCarRating} />
                    <Typo style={[s.ratingLabel, { color: colors.textSecondary }]}>
                      {RATING_LABELS[carRating]}
                    </Typo>
                  </View>
                  <View
                    style={[s.textareaWrap, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <TextInput
                      multiline
                      value={carComment}
                      onChangeText={t => setCarComment(t.slice(0, MAX_COMMENT))}
                      placeholder="How was the car? Cleanliness, comfort, condition…"
                      placeholderTextColor={colors.textSecondary}
                      style={[s.textarea, { color: colors.textPrimary }]}
                    />
                    <Typo style={[s.counter, { color: colors.textSecondary }]}>
                      {carComment.length}/{MAX_COMMENT}
                    </Typo>
                  </View>
                </View>

                {/* ── PROVIDER RATING (optional) ── */}
                <View style={[s.section, { borderColor: colors.border, backgroundColor: mode === 'dark' ? '#0F172A' : '#F8FAFC' }]}>
                  <View style={s.sectionHead}>
                    <Icon name="business" size={16} color={BRAND} />
                    <View style={{ flex: 1 }}>
                      <Typo style={[s.sectionTitle, { color: colors.textPrimary }]}>
                        The provider
                      </Typo>
                      {providerName && (
                        <Typo style={[s.sectionSub, { color: colors.textSecondary }]}>
                          {providerName}
                        </Typo>
                      )}
                    </View>
                    <Typo style={[s.optBadge, { color: colors.textSecondary }]}>OPTIONAL</Typo>
                  </View>
                  <View style={s.starsBlock}>
                    <StarRating value={providerRating} size={30} gap={6} onChange={setProviderRating} />
                    <Typo style={[s.ratingLabel, { color: colors.textSecondary }]}>
                      {RATING_LABELS[providerRating]}
                    </Typo>
                  </View>
                  {providerRating > 0 && (
                    <View
                      style={[s.textareaWrap, { backgroundColor: colors.background, borderColor: colors.border }]}
                    >
                      <TextInput
                        multiline
                        value={providerComment}
                        onChangeText={t => setProviderComment(t.slice(0, MAX_COMMENT))}
                        placeholder="Pickup punctuality, communication, professionalism…"
                        placeholderTextColor={colors.textSecondary}
                        style={[s.textarea, { color: colors.textPrimary }]}
                      />
                      <Typo style={[s.counter, { color: colors.textSecondary }]}>
                        {providerComment.length}/{MAX_COMMENT}
                      </Typo>
                    </View>
                  )}
                </View>
              </ScrollView>

              <AppButton
                title={submitting ? 'Submitting…' : 'Submit review'}
                loading={submitting}
                onPress={handleSubmit}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 3, lineHeight: 17 },

  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  sectionSub: { fontSize: 11, marginTop: 1 },
  reqBadge: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  optBadge: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },

  starsBlock: { alignItems: 'center', gap: 4 },
  ratingLabel: { fontSize: 12, fontWeight: '600' },

  textareaWrap: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
  },
  textarea: {
    fontSize: 13,
    padding: 0,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 10, textAlign: 'right', marginTop: 4 },
});
