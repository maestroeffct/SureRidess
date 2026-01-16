import React from 'react';
import { View, Image, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';

export function SplashScreen() {
  const { mode } = useTheme();

  const gradientColors =
    mode === 'dark'
      ? ['#021B18', '#032F2B', '#021B18']
      : ['#021B18', '#032F2B', '#021B18'];

  return (
    <>
      <StatusBar hidden />
      <LinearGradient colors={gradientColors} style={styles.container}>
        <View style={styles.content}>
          {/* Logo Icon */}
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoIcon}
            resizeMode="contain"
          />

          {/* Logo Text */}
          <Image
            source={require('@/assets/images/logo-text.png')}
            style={[styles.logoText, { tintColor: '#ffffffff' }]}
            resizeMode="contain"
          />

          {/* Tagline */}
          {/* <Image
            source={require('@/assets/images/logo-tagline.png')}
            style={styles.tagline}
            resizeMode="contain"
          /> */}
        </View>
      </LinearGradient>
    </>
  );
}
