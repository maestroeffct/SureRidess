import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Typo } from '@/components/AppText/Typo';
import styles from './styles';

export function HomeScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Typo variant="heading">Hello 👋</Typo>
        <Typo variant="body">What mobility service do you need today?</Typo>
      </View>

      {/* Modules */}
      <View style={styles.grid}>
        <ModuleCard title="Car Rental" />
        <ModuleCard title="Ride Share" disabled />
        <ModuleCard title="Mobile Mechanic" disabled />
        <ModuleCard title="Insurance" disabled />
      </View>
    </ScrollView>
  );

  function ModuleCard({
    title,
    disabled,
  }: {
    title: string;
    disabled?: boolean;
  }) {
    return (
      <TouchableOpacity
        disabled={disabled}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            opacity: disabled ? 0.5 : 1,
            borderColor: colors.border,
          },
        ]}
      >
        <Typo variant="subheading">{title}</Typo>
        {disabled && <Typo variant="caption">Coming soon</Typo>}
      </TouchableOpacity>
    );
  }
}
