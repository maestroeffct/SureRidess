import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typo } from '../../AppText/Typo';
import { CheckRadio } from '../../CheckRadio/CheckRadio';
import { useTheme } from '@/theme/ThemeProvider';
import type { ProtectionTier } from '@/types/rental';

const GREEN = '#0B6E4F';

const TIER_ACCENT: Record<ProtectionTier, string> = {
  BASIC: '#94A3B8',
  STANDARD: '#0EA5E9',
  PREMIUM: '#8B5CF6',
  ELITE: '#F59E0B',
};
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
  tier,
  deductibleLabel,
  highlights,
}: {
  title: string;
  description: string;
  price: string;
  selected: boolean;
  onPress: () => void;
  tier?: ProtectionTier;
  deductibleLabel?: string;
  highlights?: string[];
}) {
  const { colors, mode } = useTheme();
  const selectedBg = mode === 'dark' ? SELECTED_BG_DARK : SELECTED_BG_LIGHT;
  const accent = tier ? TIER_ACCENT[tier] : undefined;

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
        <View style={insuranceStyles.titleRow}>
          <Typo style={{ color: colors.textPrimary }}>{title}</Typo>
          {tier && accent && (
            <View
              style={[
                insuranceStyles.tierBadge,
                { backgroundColor: `${accent}22`, borderColor: `${accent}55` },
              ]}
            >
              <Typo style={[insuranceStyles.tierText, { color: accent }]}>
                {tier}
              </Typo>
            </View>
          )}
        </View>
        <Typo variant="caption" style={{ color: colors.textSecondary }}>
          {description}
        </Typo>
        {(deductibleLabel || (highlights && highlights.length > 0)) && (
          <View style={insuranceStyles.metaRow}>
            {deductibleLabel && (
              <Typo variant="caption" style={insuranceStyles.metaText}>
                Deductible {deductibleLabel}
              </Typo>
            )}
            {highlights?.slice(0, 2).map(h => (
              <Typo key={h} variant="caption" style={insuranceStyles.metaText}>
                • {h}
              </Typo>
            ))}
          </View>
        )}
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
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  price: {
    color: GREEN,
    fontWeight: '600',
  },
});
