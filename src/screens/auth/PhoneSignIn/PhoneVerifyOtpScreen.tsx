import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import { useAuth } from '@/providers/AuthProvider';
import {
  confirmPhoneOtp,
  sendPhoneOtp,
  verifyPhoneWithBackend,
} from '@/services/firebasePhoneAuth.service';

type Props = {
  route: {
    params: {
      phone: string;
      verificationId: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
};

// Pull every interesting field off an unknown error into one log line so
// the toast and the console show the same payload.
function inspectError(prefix: string, err: any) {
  const code = err?.code;
  const message = err?.message;
  const responseStatus = err?.response?.status;
  const responseData = err?.response?.data;
  const stack = err?.stack;
  console.log(`[PhoneVerifyOtp] ${prefix}`, {
    code,
    message,
    responseStatus,
    responseData,
    raw: err,
  });
  if (stack) console.log(`[PhoneVerifyOtp] ${prefix} stack`, stack);
}

// Module-level helper (not a component) — can't use the useTranslation hook,
// so it calls the shared i18next instance's t() directly with an explicit
// namespace.
function describeError(err: any): string {
  const t = (key: string, options?: Record<string, unknown>) =>
    i18n.t(key, { ns: 'auth', ...options });

  const code = err?.code as string | undefined;
  if (code === 'auth/invalid-verification-code')
    return t('phoneVerifyOtpScreen.invalidCode');
  if (code === 'auth/code-expired')
    return t('phoneVerifyOtpScreen.codeExpired');
  if (code === 'auth/session-expired')
    return t('phoneVerifyOtpScreen.sessionExpired');
  if (code === 'auth/too-many-requests')
    return t('phoneVerifyOtpScreen.tooManyAttempts');
  if (code === 'auth/network-request-failed')
    return t('phoneVerifyOtpScreen.networkError');

  const backendMsg = err?.response?.data?.message;
  if (backendMsg) return t('phoneVerifyOtpScreen.backendError', { message: backendMsg });

  if (code) return `${code}${err?.message ? ` · ${err.message}` : ''}`;
  return err?.message || t('phoneVerifyOtpScreen.verificationFailedFallback');
}

export function PhoneVerifyOtpScreen({ route }: Props) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const { t } = useTranslation('auth');
  const { phone, firstName, lastName, email } = route.params;

  // Held in state so the Resend flow can swap in a fresh verificationId
  // without remounting the screen.
  const [verificationId, setVerificationId] = useState(route.params.verificationId);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [counter, setCounter] = useState(60);

  const inputs = useRef<TextInput[]>([]);
  const otpComplete = code.every(d => d.length === 1);

  useEffect(() => {
    if (counter === 0) return;
    const timer = setInterval(() => setCounter(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  const handleVerify = async (otp: string) => {
    if (otp.length !== 6) return;
    try {
      setLoading(true);
      const idToken = await confirmPhoneOtp(verificationId, otp);
      const res = await verifyPhoneWithBackend({
        idToken,
        firstName,
        lastName,
        email,
      });
      const greeting = res.user.isNewUser
        ? t('phoneVerifyOtpScreen.welcomeNewUser')
        : t('phoneVerifyOtpScreen.signedInSuccess');
      showSuccess(greeting);
      await login(res.token, {
        id: res.user.id,
        email: res.user.email,
        firstName: res.user.firstName,
      });
    } catch (err) {
      inspectError('verify failed', err);
      showError(describeError(err));
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      const newVerificationId = await sendPhoneOtp(phone);
      setVerificationId(newVerificationId);
      setCounter(60);
      showSuccess(t('phoneVerifyOtpScreen.newCodeSent'));
    } catch (err) {
      inspectError('resend failed', err);
      showError(describeError(err));
    } finally {
      setResending(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    // Handle paste of the full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const next = [...code];
      for (let i = 0; i < 6; i++) next[i] = digits[i] ?? '';
      setCode(next);
      const lastFilled = Math.min(digits.length, 5);
      inputs.current[lastFilled]?.focus();
      if (digits.length === 6) handleVerify(digits.join(''));
      return;
    }

    const char = value.slice(-1);
    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    if (char && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (!char && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (newCode.every(d => d.length === 1)) {
      handleVerify(newCode.join(''));
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0A6A4B" />

      {/* ── GREEN HERO ── */}
      <View style={s.hero}>
        <View style={s.iconCircle}>
          <Icon name="phone-portrait-outline" size={36} color="#fff" />
        </View>
        <Typo style={s.heroTitle}>{t('phoneVerifyOtpScreen.heroTitle')}</Typo>
        <Typo style={s.heroSub}>
          {t('phoneVerifyOtpScreen.heroSubtitle')}{'\n'}
          <Typo style={s.heroPhone}>{phone}</Typo>
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
            {t('phoneVerifyOtpScreen.title')}
          </Typo>
          <Typo style={[s.formSub, { color: colors.textSecondary }]}>
            {t('phoneVerifyOtpScreen.subtitle')}
          </Typo>

          {/* OTP Boxes */}
          <View style={s.otpRow}>
            {code.map((digit, index) => (
              <AppInput
                key={index}
                variant="otp"
                value={digit}
                keyboardType="number-pad"
                maxLength={1}
                inputRef={ref => {
                  inputs.current[index] = ref!;
                }}
                onChangeText={v => handleChange(v, index)}
                containerStyle={s.otpContainer}
                wrapperStyle={[
                  s.otpInput,
                  { borderColor: digit ? '#0A6A4B' : colors.border },
                ]}
              />
            ))}
          </View>

          <AppButton
            title={t('phoneVerifyOtpScreen.verifyButton')}
            loading={loading}
            disabled={!otpComplete}
            onPress={() => handleVerify(code.join(''))}
          />

          <View style={s.timerRow}>
            {counter > 0 ? (
              <Typo style={[s.timerText, { color: colors.textSecondary }]}>
                {t('phoneVerifyOtpScreen.resendCountdown')} <Typo style={s.timerCount}>{counter}s</Typo>
              </Typo>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={resending}>
                <Typo style={s.resendLink}>
                  {resending ? t('phoneVerifyOtpScreen.sendingLabel') : t('phoneVerifyOtpScreen.resendLink')}
                </Typo>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.hintRow}>
            <Icon
              name="information-circle-outline"
              size={15}
              color={colors.textSecondary}
            />
            <Typo style={[s.hintText, { color: colors.textSecondary }]}>
              {t('phoneVerifyOtpScreen.resendHint')}
            </Typo>
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
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 10,
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
  heroPhone: {
    color: '#fff',
    fontWeight: '700',
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
    marginBottom: 28,
  },

  /* otp */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 28,
  },
  otpContainer: {
    flex: 1,
  },
  otpInput: {
    height: 64,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    borderWidth: 1.5,
    borderRadius: 14,
  },

  /* timer */
  timerRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  timerText: {
    fontSize: 14,
  },
  timerCount: {
    color: '#0A6A4B',
    fontWeight: '700',
  },
  resendLink: {
    color: '#0A6A4B',
    fontSize: 14,
    fontWeight: '700',
  },

  /* hint */
  hintRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 24,
    padding: 14,
    backgroundColor: 'rgba(10, 106, 75, 0.06)',
    borderRadius: 12,
  },
  hintText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
