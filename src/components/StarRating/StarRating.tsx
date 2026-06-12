import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

const AMBER = '#FBBF24';

type Props = {
  /** 0-5 inclusive. Fractions render as half stars. */
  value: number;
  /** Default 14 */
  size?: number;
  /** Gap between stars. Default size * 0.15 */
  gap?: number;
  /** Color of filled stars. Default amber. */
  color?: string;
  /** Color of unfilled stars. */
  emptyColor?: string;
  /** Interactive: invoked with new rating 1–5 when a star is tapped. */
  onChange?: (next: number) => void;
  /** Custom wrapper style. */
  style?: ViewStyle;
};

export function StarRating({
  value,
  size = 14,
  gap,
  color = AMBER,
  emptyColor = 'rgba(180,180,180,0.45)',
  onChange,
  style,
}: Props) {
  const clamped = Math.max(0, Math.min(5, value));
  const interactive = typeof onChange === 'function';
  const realGap = gap ?? Math.max(2, size * 0.15);

  return (
    <View style={[s.row, { gap: realGap }, style]}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = clamped >= i;
        const half = !filled && clamped >= i - 0.5;
        const name = filled ? 'star' : half ? 'star-half' : 'star-outline';
        const c = filled || half ? color : emptyColor;

        if (interactive) {
          return (
            <TouchableOpacity
              key={i}
              onPress={() => onChange?.(i)}
              hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
              activeOpacity={0.65}
            >
              <Icon name={name as any} size={size} color={c} />
            </TouchableOpacity>
          );
        }
        return <Icon key={i} name={name as any} size={size} color={c} />;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
