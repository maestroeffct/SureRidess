import React, { useEffect, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Modal, View } from 'react-native';
import { SplashScreen } from '@/screens/branding/Splashscreen';
import { UpdateRequiredScreen } from '@/screens/branding/UpdateRequiredScreen';
import { AuthNavigator } from './Auth/AuthNavigator';
import { MainDrawerNavigator } from './MainDrawerNavigator';
import { KYCFlowNavigator } from '@/modules/kyc/navigation/KYCFlowNavigator';
import { OnboardingScreen } from '@/screens/auth/Onboarding/OnboardingScreen';
import { useAuth } from '@/providers/AuthProvider';
import { Typo } from '@/components/AppText/Typo';
import { AppButton } from '@/components/AppButton/CustomButton';
import { navigate } from '@/navigation/navigationRef';
import { getItem, StorageKeys } from '@/helpers/storage';
import { useTheme } from '@/theme/ThemeProvider';
import {
  fetchUpdatePolicy,
  decideUpdate,
  type UpdateDecision,
} from '@/services/appUpdate.service';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { status, user } = useAuth();
  const { colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKycPrompt, setShowKycPrompt] = useState(false);
  const [kycPromptDismissed, setKycPromptDismissed] = useState(false);
  const [updateDecision, setUpdateDecision] = useState<UpdateDecision>({
    state: 'allowed',
  });
  const [softUpdateDismissed, setSoftUpdateDismissed] = useState(false);

  // Load splash + onboarding flag + update policy together so there's no flicker
  useEffect(() => {
    const init = async () => {
      const [, seen, policy] = await Promise.all([
        new Promise<void>(r => setTimeout(() => r(), 2000)), // 2s splash
        getItem<boolean>(StorageKeys.HAS_SEEN_ONBOARDING),
        fetchUpdatePolicy(),
      ]);
      setShowOnboarding(!seen);
      setUpdateDecision(decideUpdate(policy));
      setReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setKycPromptDismissed(false);
      setShowKycPrompt(false);
    }
  }, [status]);

  const profileStatus = useMemo(() => {
    return (
      user?.profileStatus ||
      user?.kycStatus ||
      ''
    ).toString().toUpperCase();
  }, [user]);

  const needsKycPrompt = useMemo(() => {
    if (status !== 'authenticated') return false;
    if (!profileStatus) return true;
    if (['APPROVED', 'VERIFIED', 'COMPLETED'].includes(profileStatus)) return false;
    if (['PENDING', 'PENDING_VERIFICATION', 'IN_REVIEW', 'SUBMITTED'].includes(profileStatus)) return false;
    return true;
  }, [status, profileStatus]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (needsKycPrompt && !kycPromptDismissed) {
      setShowKycPrompt(true);
    } else {
      setShowKycPrompt(false);
    }
  }, [status, needsKycPrompt, kycPromptDismissed]);

  // Show splash while loading
  if (!ready || status === 'initializing') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
      </Stack.Navigator>
    );
  }

  // ── Force-update gate ────────────────────────────────────────────────────
  // Hard block: user must update before doing anything else
  if (updateDecision.state === 'force_update') {
    return <UpdateRequiredScreen policy={updateDecision.policy} />;
  }
  // Soft prompt: show once, allow skip into the app
  if (updateDecision.state === 'soft_update' && !softUpdateDismissed) {
    return (
      <UpdateRequiredScreen
        policy={updateDecision.policy}
        onSkip={() => setSoftUpdateDismissed(true)}
      />
    );
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {status === 'unauthenticated' && (
          <>
            {/* Onboarding is first screen when unseen — React Navigation picks first as initial */}
            {showOnboarding && (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            )}
            <Stack.Screen name="Auth" component={AuthNavigator} />
          </>
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
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 20,
            gap: 12,
          }}>
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
