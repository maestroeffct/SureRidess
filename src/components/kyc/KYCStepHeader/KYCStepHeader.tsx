import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';

type Props = {
  step: number;
  title: string;
  onBack?: () => void;
};

export function KYCStepHeader({ step, title, onBack }: Props) {
  const { mode, colors } = useTheme();
  const stepBg = mode === 'dark' ? '#0F3027' : '#EAF2EF';
  const progressColor = mode === 'dark' ? '#34D399' : '#1B7C63';

  return (
    <>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Typo variant="subheading" style={{ color: colors.textPrimary }}>
          Document Verification
        </Typo>
        <View style={{ width: 22 }} />
      </View>

      {/* Step indicator */}
      <View style={[styles.stepContainer, { backgroundColor: stepBg }]}>
        <Typo style={[styles.progressText, { color: progressColor }]}>
          {step} of 3 steps completed
        </Typo>

        <Typo
          variant="heading"
          style={[styles.title, { color: colors.textPrimary }]}
        >
          {title}
        </Typo>
      </View>
    </>
  );
}
