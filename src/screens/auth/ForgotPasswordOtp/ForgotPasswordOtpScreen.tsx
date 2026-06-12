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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import { resendForgotPasswordOtp, verifyResetOtp } from '@/services/auth.service';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';

type Props = {
  route: {
    params: {
      email: string;
    };
  };
};

export function ForgotPasswordOtpScreen({ route }: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { email } = route.params;

  const [code, setCode] = useState(['', '', '', '']);
  const inputs = useRef<TextInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(60);

  const otpComplete = code.every(d => d.length === 1);

  useEffect(() => {
    if (counter === 0) return;
    const timer = setInterval(() => setCounter(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  const handleChange = (value: string, index: number) => {
    const char = value.slice(-1);
    if (char && !/^\d$/.test(char)) return;

    const next = [...code];
    next[index] = char;
    setCode(next);

    if (char && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }
    if (!char && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    if (next.every(d => d.length === 1)) {
      handleVerify(next.join(''));
    }
  };

  const handleVerify = async (otp?: string) => {
    const finalOtp = otp ?? code.join('');
    if (finalOtp.length !== 4) {
      showError('Enter the 4-digit code');
      return;
    }
    try {
      setLoading(true);
      await verifyResetOtp({ email, otp: finalOtp });
      showSuccess('Email verified');
      navigation.navigate('ResetPassword', { email, otp: finalOtp });
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendForgotPasswordOtp(email);
      showSuccess('Verification code resent');
      setCounter(60);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Failed to resend');
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
          <Icon name="mail-open-outline" size={36} color="#fff" />
        </View>
        <Typo style={s.heroTitle}>Check Your Email</Typo>
        <Typo style={s.heroSub}>
          We sent a 4-digit code to{'\n'}
          <Typo style={s.heroEmail}>{maskEmail(email)}</Typo>
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
            Verify Email Address
          </Typo>
          <Typo style={[s.formSub, { color: colors.textSecondary }]}>
            Enter the 6-digit verification code to continue resetting your password
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
            title="Verify & Continue"
            onPress={() => handleVerify()}
            loading={loading}
            disabled={!otpComplete || loading}
          />

          <View style={s.timerRow}>
            {counter > 0 ? (
              <Typo style={[s.timerText, { color: colors.textSecondary }]}>
                Resend code in{' '}
                <Typo style={s.timerCount}>{counter}s</Typo>
              </Typo>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Typo style={s.resendLink}>Resend Code</Typo>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.hintBox}>
            <Icon name="information-circle-outline" size={15} color={colors.textSecondary} />
            <Typo style={[s.hintText, { color: colors.textSecondary }]}>
              Didn't get the email? Check your spam folder or tap "Resend Code" above.
            </Typo>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ── HELPERS ── */
function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 3)}*****@${domain}`;
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
  heroEmail: {
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
    lineHeight: 20,
  },

  /* otp */
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  otpContainer: {
    flex: 1,
  },
  otpInput: {
    height: 72,
    textAlign: 'center',
    fontSize: 24,
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
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 24,
    padding: 14,
    backgroundColor: 'rgba(10, 106, 75, 0.06)',
    borderRadius: 12,
  },
  hintText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
});
