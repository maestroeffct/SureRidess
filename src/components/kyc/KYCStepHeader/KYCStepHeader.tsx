import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  step: number;
  title: string;
  onBack?: () => void;
};

export function KYCStepHeader({ step, title, onBack }: Props) {
  return (
    <>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="chevron-back" size={22} />
        </TouchableOpacity>
        <Typo variant="subheading">Document Verification</Typo>
        <View style={{ width: 22 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.stepContainer}>
        <Typo style={styles.progressText}>{step} of 3 steps completed</Typo>

        <Typo variant="heading" style={styles.title}>
          {title}
        </Typo>
      </View>
    </>
  );
}
