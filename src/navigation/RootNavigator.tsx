import React, { useEffect, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Modal, View } from 'react-native';
import { SplashScreen } from '@/screens/branding/Splashscreen';
import { AuthNavigator } from './Auth/AuthNavigator';
import { MainDrawerNavigator } from './MainDrawerNavigator';
import { KYCFlowNavigator } from '@/modules/kyc/navigation/KYCFlowNavigator';
import { useAuth } from '@/providers/AuthProvider';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { navigate } from '@/navigation/navigationRef';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { status, user } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showKycPrompt, setShowKycPrompt] = useState(false);
  const [kycPromptDismissed, setKycPromptDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setKycPromptDismissed(false);
      setShowKycPrompt(false);
    }
  }, [status]);

  const profileStatus = useMemo(() => {
    const statusRaw = (
      user?.profileStatus ||
      user?.kycStatus ||
      user?.kycStatus?.toString() ||
      ''
    )
      .toString()
      .toUpperCase();
    return statusRaw;
  }, [user]);

  const needsKycPrompt = useMemo(() => {
    if (status !== 'authenticated') return false;

    if (!profileStatus) return true;

    const isVerified = ['APPROVED', 'VERIFIED', 'COMPLETED'].includes(
      profileStatus,
    );

    const isSubmittedForReview = [
      'PENDING',
      'PENDING_VERIFICATION',
      'IN_REVIEW',
      'SUBMITTED',
    ].includes(profileStatus);

    if (isVerified || isSubmittedForReview) {
      return false;
    }

    return true;
  }, [status, profileStatus]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    if (needsKycPrompt && !kycPromptDismissed) {
      setShowKycPrompt(true);
      return;
    }

    setShowKycPrompt(false);
  }, [status, needsKycPrompt, kycPromptDismissed]);

  if (showSplash || status === 'initializing') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 🔐 Not logged in */}
      {status === 'unauthenticated' && (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}

      {status === 'authenticated' && (
        <>
          <Stack.Screen name="Main" component={MainDrawerNavigator} />
          <Stack.Screen name="KYCFlow" component={KYCFlowNavigator} />
        </>
      )}
      </Stack.Navigator>

      <Modal
        visible={showKycPrompt}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKycPrompt(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 20,
              gap: 12,
            }}
          >
            <Typo variant="subheading">Complete Your KYC</Typo>
            <Typo variant="caption">
              You can browse now, but payment requires verified documents.
            </Typo>

            <AppButton
              title="Upload Documents"
              onPress={() => {
                setShowKycPrompt(false);
                setKycPromptDismissed(true);
                navigate('KYCFlow');
              }}
            />

            <AppButton
              title="Skip for now"
              variant="outline"
              onPress={() => {
                setShowKycPrompt(false);
                setKycPromptDismissed(true);
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
