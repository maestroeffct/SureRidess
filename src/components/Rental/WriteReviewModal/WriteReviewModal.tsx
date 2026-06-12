import React, { useEffect, useState } from 'react';
import {
  Modal,
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

type Props = {
  visible: boolean;
  carId: string;
  bookingId: string;
  /** Display string for the car, used in the header. e.g. "Toyota Camry 2022" */
  carTitle?: string;
  onClose: () => void;
  /** Called after a successful submission. Parent can refresh the booking. */
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
  onClose,
  onSubmitted,
}: Props) {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setRating(0);
      setComment('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (rating < 1) {
      showError('Please choose a rating');
      return;
    }
    try {
      setSubmitting(true);
      await submitCarReview(carId, {
        bookingId,
        rating,
        comment: comment.trim() || undefined,
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
                  {carTitle ? (
                    <Typo style={[s.subtitle, { color: colors.textSecondary }]}>
                      {carTitle}
                    </Typo>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Stars */}
              <View style={s.starsWrap}>
                <StarRating
                  value={rating}
                  size={36}
                  gap={8}
                  onChange={setRating}
                />
                <Typo style={[s.ratingLabel, { color: colors.textSecondary }]}>
                  {RATING_LABELS[rating]}
                </Typo>
              </View>

              {/* Comment */}
              <View
                style={[
                  s.textareaWrap,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}
              >
                <TextInput
                  multiline
                  value={comment}
                  onChangeText={t => setComment(t.slice(0, MAX_COMMENT))}
                  placeholder="Share details about the car and the trip (optional)"
                  placeholderTextColor={colors.textSecondary}
                  style={[s.textarea, { color: colors.textPrimary }]}
                />
                <Typo style={[s.counter, { color: colors.textSecondary }]}>
                  {comment.length}/{MAX_COMMENT}
                </Typo>
              </View>

              {/* Submit */}
              <AppButton
                title={submitting ? 'Submitting…' : 'Submit Review'}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  starsWrap: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  ratingLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  textareaWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
  },
  textarea: {
    fontSize: 14,
    padding: 0,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 11, textAlign: 'right', marginTop: 4 },
});
