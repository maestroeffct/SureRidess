import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import styles from './styles';
import { resetPassword } from '@/services/auth.service';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';

type Props = {
  route: {
    params: {
      email: string;
    };
  };
};

export function ResetPasswordScreen({ route }: Props) {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

  const { email } = route.params;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 8) {
      showError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      await resetPassword({
        email,
        password,
      });

      showSuccess('Password reset successful');

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (err: any) {
      showError(err?.response?.data?.message || 'Reset failed');
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

      {/* Header */}
      <View style={styles.header}>
        <Typo variant="heading">New Password</Typo>
        <Typo variant="body" style={styles.subtitle}>
          Please write your new password
        </Typo>
      </View>

      {/* Password */}
      <AppInput
        label="Password"
        placeholder="********"
        secureTextEntry={!showPass}
        value={password}
        onChangeText={setPassword}
        rightIcon={
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Icon
              name={showPass ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        }
      />

      {/* Confirm */}
      <AppInput
        label="Confirm Password"
        placeholder="********"
        secureTextEntry={!showConfirm}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        rightIcon={
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Icon
              name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        }
      />

      {/* Action */}
      <AppButton
        title="Reset Password"
        loading={loading}
        style={styles.button}
        onPress={handleSubmit}
      />
    </ScreenWrapper>
  );
}
