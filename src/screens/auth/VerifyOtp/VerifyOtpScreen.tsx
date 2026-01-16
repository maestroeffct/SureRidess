import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { AppInput } from '@/components/AppInput/Input';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import { verifyOtp } from '@/services/auth.service';
import { useAuth } from '@/providers/AuthProvider';
import styles from './styles';

type Props = {
  route: {
    params: {
      userId: string;
      phone: string;
    };
  };
};

export function VerifyOtpScreen({ route }: Props) {
  const { colors } = useTheme();
  const { login } = useAuth();
  const { userId, phone } = route.params;

  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(56);

  const inputs = useRef<TextInput[]>([]);

  const otpComplete = code.every(d => d.length === 1);

  useEffect(() => {
    if (counter === 0) return;
    const timer = setInterval(() => setCounter(p => p - 1), 1000);
    return () => clearInterval(timer);
  }, [counter]);

  const handleVerify = async (otp: string) => {
    if (otp.length !== 4) return;

    try {
      setLoading(true);
      const res = await verifyOtp({ userId, code: otp });

      setTimeout(() => {
        showSuccess('Phone number verified successfully');
      }, 500);
      login(res.accessToken);
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string, index: number) => {
    // keep only last character typed (guards against paste)
    const char = value.slice(-1);
    const newCode = [...code];
    newCode[index] = char;
    setCode(newCode);

    // move to next input when a digit is entered
    if (char && index < inputs.current.length - 1) {
      inputs.current[index + 1]?.focus();
    }

    // move to previous input when cleared
    if (!char && index > 0) {
      inputs.current[index - 1]?.focus();
    }

    // if all digits entered, auto-verify
    if (newCode.every(d => d.length === 1)) {
      handleVerify(newCode.join(''));
    }
  };

  return (
    <ScreenWrapper showBack>
      <View style={styles.spacer} />

      <Typo variant="heading">Verify your account</Typo>

      <Typo variant="body" style={styles.subtitle}>
        An OTP has been sent to your number {phone}. Please enter the code below
        to verify your account.
      </Typo>

      {/* OTP */}
      <View style={styles.otpRow}>
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
            containerStyle={styles.otpContainer}
            wrapperStyle={[
              styles.otpInput,
              {
                borderColor: digit ? colors.success : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <AppButton
        title="Verify"
        loading={loading}
        disabled={!otpComplete}
        onPress={() => handleVerify(code.join(''))}
      />

      {counter > 0 ? (
        <Typo variant="caption" style={{ textAlign: 'center', marginTop: 12 }}>
          Resend Code in <Typo color={colors.primary}>{counter}</Typo> seconds
        </Typo>
      ) : (
        <TouchableOpacity style={styles.resend} onPress={() => setCounter(56)}>
          <Typo color={colors.primary}>Resend Code</Typo>
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}
