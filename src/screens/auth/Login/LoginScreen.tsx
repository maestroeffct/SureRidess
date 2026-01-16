import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { useTheme } from '@/theme/ThemeProvider';
import { Typo } from '@/components/AppText/Typo';
import { AppInput } from '@/components/AppInput/Input';
import { AppButton } from '@/components/AppButton/CustomButton';
import styles from './styles';
import { useAuth } from '@/providers/AuthProvider';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from 'node_modules/@react-navigation/native-stack/lib/typescript/src/types';
import { AuthStackParamList } from '@/navigation/Auth/AuthNavigator';
import { showError, showSuccess } from '@/helpers/toast';
import { loginUser } from '@/services/auth.service';

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      const res = await loginUser({ email, password });

      // ✅ normal login
      login(res.accessToken);
    } catch (err: any) {
      // 🔥 THIS IS THE IMPORTANT PART
      if (
        err?.response?.status === 403 &&
        err?.response?.data?.status === 'verification_required'
      ) {
        setTimeout(() => {
          showSuccess('Please verify your phone number to continue');
        }, 500);

        navigation.navigate('VerifyOtp', {
          userId: err.response.data.userId,
          phone: err.response.data.phone,
        });
        return;
      }

      showError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable>
      {/* Header */}
      <View style={styles.header}>
        <Typo variant="heading">Welcome back!</Typo>
        <Typo variant="body">Sign in to continue your journey.</Typo>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <AppInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          placeholder="JohnDoe@gmail.com"
        />

        <AppInput
          label="Password"
          placeholder="********"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        <TouchableOpacity style={styles.forgot}>
          <Typo variant="button" color={colors.primary}>
            Forgot Password?
          </Typo>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <AppButton title="Sign In" loading={loading} onPress={handleLogin} />

      <AppButton
        style={{ marginTop: 16 }}
        onPress={() => {
          handleLogin();
        }}
        title="Sign in with Google"
        variant="outline"
        leftIcon={
          <Icon name="logo-google" size={20} color={colors.textPrimary} />
        }
      />

      {/* Footer */}
      <View style={styles.footer}>
        <Typo variant="caption">
          Don’t have an account?{' '}
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Typo color={colors.primary}>Sign Up</Typo>
          </TouchableOpacity>
        </Typo>
      </View>
    </ScreenWrapper>
  );
}
