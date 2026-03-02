import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useTheme } from '@/theme/ThemeProvider';
import styles from './styles';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';
import { isValidEmail } from '@/helpers/validation';
import { showError, showSuccess } from '@/helpers/toast';
import { forgotPassword } from '@/services/auth.service';

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

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
    <ScreenWrapper>
      {/* Back */}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Typo color={colors.primary}>← Back</Typo>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.header}>
        <Typo variant="heading">Reset Password</Typo>

        <Typo variant="body" style={styles.subtitle}>
          Kindly enter your email address to receive a confirmation code to set
          a new password
        </Typo>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <AppInput
          label="Email Address"
          placeholder="JohnDoe@gmail.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Action */}
      <AppButton
        title="Confirm Email Address"
        onPress={handleSubmit}
        loading={loading}
        disabled={!email || loading}
      />
    </ScreenWrapper>
  );
}
