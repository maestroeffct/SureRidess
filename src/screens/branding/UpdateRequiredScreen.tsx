import React, { useCallback } from 'react';
import {
  View,
  Image,
  StatusBar,
  Linking,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from '@react-native-vector-icons/ionicons';
import { Typo } from '@/components/AppText/Typo';
import type { AppUpdatePolicy } from '@/services/appUpdate.service';

type Props = {
  policy: AppUpdatePolicy;
  /**
   * When the policy is a soft update we render a Skip button. The caller can
   * pass a handler to dismiss this screen and continue into the app.
   */
  onSkip?: () => void;
};

export function UpdateRequiredScreen({ policy, onSkip }: Props) {
  const open = useCallback(async () => {
    if (!policy.store_url) return;
    try {
      const can = await Linking.canOpenURL(policy.store_url);
      if (can) await Linking.openURL(policy.store_url);
    } catch {
      // ignore — user will see no movement and can retry
    }
  }, [policy.store_url]);

  return (
    <>
      <StatusBar hidden />
      <LinearGradient
        colors={['#021B18', '#032F2B', '#021B18']}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <Icon name="cloud-download-outline" size={40} color="#22c55e" />
          </View>

          <Image
            source={require('@/assets/images/logo-text.png')}
            style={[styles.logoText, { tintColor: '#ffffff' }]}
            resizeMode="contain"
          />

          <View style={styles.textBlock}>
            <Typo variant="heading" style={styles.title} color="#ffffff">
              {policy.title || 'Update Required'}
            </Typo>
            <Typo variant="body" style={styles.message} color="rgba(255,255,255,0.75)">
              {policy.message ||
                'A newer version of SureRide is available. Please update to continue.'}
            </Typo>

            {policy.latest_version_name ? (
              <Typo
                variant="caption"
                style={styles.versionInfo}
                color="rgba(255,255,255,0.5)"
              >
                Latest version: {policy.latest_version_name}
              </Typo>
            ) : null}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={open}
            style={styles.primaryBtn}
          >
            <Icon
              name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-google-playstore'}
              size={18}
              color="#021B18"
            />
            <Typo variant="button" color="#021B18" style={styles.primaryBtnText}>
              {Platform.OS === 'ios' ? 'Open App Store' : 'Open Play Store'}
            </Typo>
          </TouchableOpacity>

          {onSkip ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onSkip}
              style={styles.skipBtn}
            >
              <Typo variant="button" color="rgba(255,255,255,0.6)">
                Skip for now
              </Typo>
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    gap: 20,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { width: 130, height: 30, opacity: 0.85 },
  textBlock: {
    alignItems: 'center',
    gap: 10,
    maxWidth: 360,
  },
  title: { textAlign: 'center', fontSize: 22 },
  message: { textAlign: 'center', lineHeight: 22 },
  versionInfo: { marginTop: 4 },
  primaryBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 240,
  },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
  skipBtn: {
    marginTop: 6,
    padding: 12,
  },
});
