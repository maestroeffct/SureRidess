import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/auth/Login/LoginScreen';
import { RegisterScreen } from '@/screens/auth/Register/RegisterScreen';
import { VerifyOtpScreen } from '@/screens/auth/VerifyOtp/VerifyOtpScreen';
import { ForgotPasswordScreen } from '@/screens/auth/ForgotPassword/ForgotPasswordScreen';
import { ForgotPasswordOtpScreen } from '@/screens/auth/ForgotPasswordOtp/ForgotPasswordOtpScreen';
import { ResetPasswordScreen } from '@/screens/auth/ResetPassword/ResetPasswordScreen';
import { PhoneVerifyOtpScreen } from '@/screens/auth/PhoneSignIn/PhoneVerifyOtpScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyOtp: { userId: string; email: string };
  ForgotPassword: undefined;
  ForgotPasswordOtp: { email: string };
  ResetPassword: { email: string; otp: string };
  PhoneVerifyOtp: {
    phone: string;
    verificationId: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ForgotPasswordOtp" component={ForgotPasswordOtpScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      <Stack.Screen name="PhoneVerifyOtp" component={PhoneVerifyOtpScreen} />
    </Stack.Navigator>
  );
}
