import React from 'react';
import {
  View,
  StatusBar,
  ScrollView,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  statusBarStyle?: 'light-content' | 'dark-content';
  hideStatusBar?: boolean;
  showBack?: boolean;
}

export function ScreenWrapper({
  children,
  scrollable = false,
  padded = true,
  showBack = false,
  style,
  statusBarStyle,
  hideStatusBar = false,
}: ScreenWrapperProps) {
  const { colors, mode } = useTheme();

  const resolvedStatusBarStyle =
    statusBarStyle ?? (mode === 'dark' ? 'light-content' : 'dark-content');

  const Container = scrollable ? ScrollView : View;

  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar
        hidden={hideStatusBar}
        barStyle={resolvedStatusBarStyle}
        backgroundColor={colors.background}
      />
      {showBack && (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 16 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}

      <Container
        style={[styles.container, padded && styles.padded, style]}
        contentContainerStyle={scrollable ? styles.scrollContent : undefined}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </Container>
    </SafeAreaView>
  );
}
