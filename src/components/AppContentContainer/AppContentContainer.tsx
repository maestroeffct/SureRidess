import React from 'react';
import { View } from 'react-native';
import styles from './styles';

export const AppContentContainer = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <View style={styles.container}>{children}</View>;
};
