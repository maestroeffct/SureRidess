import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import KycStatusScreen from '../screens/KycStatusScreen/KycStatusScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen/PersonalInfoScreen';
import AddressScreen from '../screens/AddressScreen/AddressScreen';
import DocumentsScreen from '../screens/DocumentsScreen/DocumentsScreen';
import FaceLivenessScreen from '../screens/FaceLivenessScreen/FaceLivenessScreen';

export type KYCStackParamList = {
  KycStatus: undefined;
  PersonalInfo: undefined;
  Address:
    | {
        countryName?: string | null;
        countryCode?: string | null;
      }
    | undefined;
  FaceLiveness:
    | {
        countryName?: string | null;
        state?: string | null;
        region?: string | null;
        homeAddress?: string | null;
      }
    | undefined;
  Documents:
    | {
        countryName?: string | null;
        state?: string | null;
        region?: string | null;
        homeAddress?: string | null;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<KYCStackParamList>();

/**
 * Entry always lands on KycStatus. That screen branches on the user's
 * current status: pending → shows "in review" (no docs restart);
 * rejected → shows reason + re-upload CTA; unverified → "Start"
 * button that navigates into PersonalInfo. Once verified, the
 * banner + gates disappear and this stack is unreachable.
 */
export function KYCFlowNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="KycStatus"
    >
      <Stack.Screen name="KycStatus" component={KycStatusScreen} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Address" component={AddressScreen} />
      <Stack.Screen name="FaceLiveness" component={FaceLivenessScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
    </Stack.Navigator>
  );
}
