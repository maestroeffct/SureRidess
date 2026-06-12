import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useTheme } from '@/theme/ThemeProvider';
import { isValidEmail } from '@/helpers/validation';
import { showError, showSuccess } from '@/helpers/toast';
import { forgotPassword } from '@/services/auth.service';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      showError('Please enter a valid email address');
      return;
    }
    try {
      setLoading(true);
      await forgotPassword({ email });
      showSuccess('Verification code sent to your email');
      navigation.navigate('ForgotPasswordOtp', { email });
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A6A4B" />

      {/* ── GREEN HERO ── */}
      <View style={s.hero}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={s.iconCircle}>
          <Icon name="key-outline" size={36} color="#fff" />
        </View>
        <Typo style={s.heroTitle}>Reset Password</Typo>
        <Typo style={s.heroSub}>
          Enter your email and we'll send you{'\n'}a verification code to reset your password
        </Typo>
      </View>

      {/* ── FORM CARD ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={[s.card, { backgroundColor: colors.background }]}
          contentContainerStyle={s.cardContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Typo style={[s.formTitle, { color: colors.textPrimary }]}>
            Forgot Password?
          </Typo>
          <Typo style={[s.formSub, { color: colors.textSecondary }]}>
            No worries — it happens. Enter your registered email address below.
          </Typo>

          <View style={s.form}>
            <AppInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={
                <Icon name="mail-outline" size={18} color={colors.textSecondary} />
              }
            />
          </View>

          <AppButton
            title="Send Reset Code"
            onPress={handleSubmit}
            loading={loading}
            disabled={!email || loading}
          />

          <View style={s.hintBox}>
            <Icon name="information-circle-outline" size={15} color={colors.textSecondary} />
            <Typo style={[s.hintText, { color: colors.textSecondary }]}>
              Check your spam or junk folder if you don't receive the email within a few minutes.
            </Typo>
          </View>

          <View style={s.footer}>
            <Typo style={[s.footerText, { color: colors.textSecondary }]}>
              Remember your password?{' '}
            </Typo>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Typo style={s.footerLink}>Sign In</Typo>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A6A4B',
  },

  /* hero */
  hero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  heroSub: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  /* card */
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flex: 1,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  formSub: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 20,
  },

  /* form */
  form: {
    marginBottom: 24,
  },

  /* hint */
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 20,
    padding: 14,
    backgroundColor: 'rgba(10, 106, 75, 0.06)',
    borderRadius: 12,
  },
  hintText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },

  /* footer */
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A6A4B',
  },
});
