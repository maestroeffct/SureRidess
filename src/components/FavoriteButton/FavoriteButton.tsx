import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { useFavorites } from '@/providers/FavoritesProvider';

type Variant = 'overlay' | 'inline';

type Props = {
  carId?: string;
  /** "overlay" = round dark bubble for hero/card overlays. "inline" = transparent for headers. */
  variant?: Variant;
  size?: number;
  style?: ViewStyle;
  onToggle?: (next: boolean) => void;
};

/**
 * Heart-button for toggling a car as a user favorite. Persists via
 * FavoritesProvider (AsyncStorage). Safe to render anywhere — no-op when
 * carId is missing.
 */
export function FavoriteButton({
  carId,
  variant = 'overlay',
  size = 22,
  style,
  onToggle,
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = !!carId && isFavorite(carId);

  if (!carId) return null;

  const handlePress = () => {
    toggleFavorite(carId);
    onToggle?.(!active);
  };

  const containerStyle =
    variant === 'overlay' ? s.overlayBubble : s.inlineBubble;

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[containerStyle, style]}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Icon
        name={active ? 'heart' : 'heart-outline'}
        size={size}
        color={active ? '#EF4444' : '#fff'}
      />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  overlayBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
