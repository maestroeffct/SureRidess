import React from 'react';
import { View } from 'react-native';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

type Props = {
  label: string;
  amount: string;
  highlight?: boolean;
};

export const PaymentSummaryRow = ({ label, amount, highlight }: Props) => {
  return (
    <View style={styles.row}>
      <Typo style={highlight && styles.highlightText}>{label}</Typo>
      <Typo
        style={
          highlight ? [styles.highlightText, styles.amount] : styles.amount
        }
      >
        {amount}
      </Typo>
    </View>
  );
};
