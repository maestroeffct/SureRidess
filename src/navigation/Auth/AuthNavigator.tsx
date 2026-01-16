import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '@/screens/auth/Login/LoginScreen';
import { RegisterScreen } from '@/screens/auth/Register/RegisterScreen';
import { VerifyOtpScreen } from '@/screens/auth/VerifyOtp/VerifyOtpScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  VerifyOtp: {
    userId: string;
    phone: string;
  };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
    </Stack.Navigator>
  );
}
