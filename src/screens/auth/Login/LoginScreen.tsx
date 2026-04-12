import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
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
import { DEV_AUTH_ENABLED, DEV_TEST_CREDENTIALS } from '@/config/devAuth';
import {
  getGoogleAuthErrorMessage,
  signInOrSignUpWithGoogle,
} from '@/services/socialAuth.service';

export function LoginScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);

      /* ---------------------------------
       * 🔐 DEV LOGIN (FRONTEND ONLY)
       * --------------------------------- */
      if (
        DEV_AUTH_ENABLED &&
        email === DEV_TEST_CREDENTIALS.email &&
        password === DEV_TEST_CREDENTIALS.password
      ) {
        login(DEV_TEST_CREDENTIALS.token, DEV_TEST_CREDENTIALS.user);

        showSuccess('Logged in with test account');
        return;
      }

      const res = await loginUser({ email, password });

      login(res.token, res.user);
    } catch (err: any) {
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

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      const res = await signInOrSignUpWithGoogle();
      await login(res.token, res.user);

      if (res.isNewUser || res.needsProfileCompletion) {
        showSuccess('Signed in with Google. Complete your profile to continue.');
        return;
      }

      showSuccess('Signed in with Google');
    } catch (error) {
      showError(getGoogleAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (__DEV__) {
      setEmail('test@sureride.dev');
      setPassword('password123');
    }
  }, []);

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

        <TouchableOpacity
          style={styles.forgot}
          onPress={() => {
            navigation.navigate('ForgotPassword');
          }}
        >
          <Typo variant="button" color={colors.primary}>
            Forgot Password?
          </Typo>
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <AppButton
        title="Sign In"
        loading={loading}
        style={styles.button}
        onPress={handleLogin}
      />

      <AppButton
        title="Sign in with Google"
        variant="outline"
        loading={googleLoading}
        onPress={handleGoogleAuth}
        leftIcon={
          <Image
            source={require('@/assets/images/google-logo.png')}
            style={{ width: 25, height: 25, marginRight: 0 }}
          />

          // <Icon name="logo-google" size={20} color={colors.textPrimary} />
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
