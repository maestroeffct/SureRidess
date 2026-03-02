import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';
import { showError, showSuccess } from '@/helpers/toast';
import {
  resendForgotPasswordOtp,
  verifyResetOtp,
} from '@/services/auth.service';

type Props = {
  route: {
    params: {
      email: string;
    };
  };
};

export function ForgotPasswordOtpScreen({ route }: Props) {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const { email } = route.params;

  const [code, setCode] = useState(['', '', '', '']);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...code];
    next[index] = value;
    setCode(next);

    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');

    if (otp.length !== 4) {
      showError('Enter the 4-digit code');
      return;
    }

    try {
      setLoading(true);

      await verifyResetOtp({
        email,
        otp,
      });

      showSuccess('Email verified');

      navigation.navigate('ResetPassword', {
        email,
        otp,
      });
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const [counter, setCounter] = useState(60);

  useEffect(() => {
    if (counter === 0) return;
    const timer = setInterval(() => setCounter(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  return (
    <ScreenWrapper>
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Typo color={colors.primary}>← Back</Typo>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Typo variant="heading">Verify Email Address</Typo>
        <Typo variant="body" style={styles.subtitle}>
          Verification code sent to {maskEmail(email)}
        </Typo>
      </View>

      {/* OTP Inputs */}
      <View style={styles.otpRow}>
        {code.map((digit, index) => {
          const filled = digit.length === 1;

          return (
            <TextInput
              key={index}
              ref={r => {
                inputs.current[index] = r;
              }}
              value={digit}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={v => handleChange(v, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              style={[
                styles.otpBox,
                {
                  borderColor: filled ? colors.success : colors.border,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Verify */}
      <AppButton
        title="Verify Email"
        onPress={handleVerify}
        loading={loading}
      />

      {/* Resend */}

      {counter > 0 ? (
        <View style={styles.resendWrapper}>
          <Typo variant="caption">
            Resend Code in <Typo color={colors.primary}>{counter}</Typo> seconds
          </Typo>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.resend}
          onPress={() =>
            resendForgotPasswordOtp(email).then(() => {
              showSuccess('Verification code resent');
              setCounter(60);
            })
          }
        >
          <Typo color={colors.primary}>Resend Code</Typo>
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}

/* ---------------- HELPERS ---------------- */
function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 3)}*****@${domain}`;
}
