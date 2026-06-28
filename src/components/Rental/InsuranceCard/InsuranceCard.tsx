import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typo } from '../../AppText/Typo';
import { CheckRadio } from '../../CheckRadio/CheckRadio';
import { useTheme } from '@/theme/ThemeProvider';

const GREEN = '#0B6E4F';
// Selected-card background per theme — light mint on light bg, deep forest
// on dark bg so the highlight reads as "selected" without burning out the text.
const SELECTED_BG_LIGHT = '#E7F5F0';
const SELECTED_BG_DARK = '#0F3027';

export function InsuranceCard({
  title,
  description,
  price,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  price: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, mode } = useTheme();
  const selectedBg = mode === 'dark' ? SELECTED_BG_DARK : SELECTED_BG_LIGHT;

  return (
    <TouchableOpacity
      style={[
        insuranceStyles.card,
        { borderColor: colors.border, backgroundColor: colors.surface },
        selected && { borderColor: GREEN, backgroundColor: selectedBg },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <CheckRadio selected={selected} />

      <View style={insuranceStyles.middle}>
        <Typo style={{ color: colors.textPrimary }}>{title}</Typo>
        <Typo variant="caption" style={{ color: colors.textSecondary }}>
          {description}
        </Typo>
      </View>

      <Typo style={insuranceStyles.price}>{price}</Typo>
    </TouchableOpacity>
  );
}

const insuranceStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  middle: {
    flex: 1,
  },
  price: {
    color: GREEN,
    fontWeight: '600',
  },
});
