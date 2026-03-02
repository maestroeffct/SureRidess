import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PersonalInfoScreen from '../screens/PersonalInfoScreen/PersonalInfoScreen';
import AddressScreen from '../screens/AddressScreen/AddressScreen';
import DocumentsScreen from '../screens/DocumentsScreen/DocumentsScreen';

export type KYCStackParamList = {
  PersonalInfo: undefined;
  Address: undefined;
  Documents: undefined;
};

const Stack = createNativeStackNavigator<KYCStackParamList>();

export function KYCFlowNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
    </Stack.Navigator>
  );
}
