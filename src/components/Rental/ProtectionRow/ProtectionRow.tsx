import React from 'react';
import { View } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type ProtectionTier = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ELITE';

const TIER_ACCENT: Record<ProtectionTier, string> = {
  BASIC: '#94A3B8',
  STANDARD: '#0EA5E9',
  PREMIUM: '#8B5CF6',
  ELITE: '#F59E0B',
};

type Props = {
  title: string;
  subtitle: string;
  price: string;
  tier?: ProtectionTier | null;
  deductibleLabel?: string;
};

export const ProtectionRow = ({
  title,
  subtitle,
  price,
  tier,
  deductibleLabel,
}: Props) => {
  const accent = tier ? TIER_ACCENT[tier] : undefined;
  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Icon name="shield-checkmark-outline" size={20} color="#2563EB" />
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Typo>{title}</Typo>
            {tier && accent && (
              <View
                style={{
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: `${accent}22`,
                  borderWidth: 1,
                  borderColor: `${accent}55`,
                }}
              >
                <Typo style={{ fontSize: 10, fontWeight: '800', color: accent, letterSpacing: 0.5 }}>
                  {tier}
                </Typo>
              </View>
            )}
          </View>
          <Typo variant="caption">{subtitle}</Typo>
          {deductibleLabel ? (
            <Typo variant="caption">Deductible {deductibleLabel}</Typo>
          ) : null}
        </View>
      </View>

      <Typo style={styles.price}>{price}</Typo>
    </View>
  );
};
