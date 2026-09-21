import React, { useEffect, useMemo, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SplashScreen } from '@/screens/branding/Splashscreen';
import { UpdateRequiredScreen } from '@/screens/branding/UpdateRequiredScreen';
import { AuthNavigator } from './Auth/AuthNavigator';
import { MainDrawerNavigator } from './MainDrawerNavigator';
import { KYCFlowNavigator } from '@/modules/kyc/navigation/KYCFlowNavigator';
import { OnboardingScreen } from '@/screens/auth/Onboarding/OnboardingScreen';
import { LanguageSelectScreen } from '@/screens/auth/Onboarding/LanguageSelectScreen';
import { CountrySelectScreen } from '@/screens/auth/Onboarding/CountrySelectScreen';
import { WelcomeWalkthroughScreen } from '@/screens/auth/Onboarding/WelcomeWalkthroughScreen';
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
  const { t } = useTranslation('main');
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // null = "haven't checked yet for this authenticated session". Kept
  // separate from `ready` so a fresh login always re-checks rather than
  // reusing a stale value from a previous session in the same app run.
  const [postAuthOnboardingSeen, setPostAuthOnboardingSeen] = useState<boolean | null>(null);
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
      setPostAuthOnboardingSeen(null);
      return;
    }
    if (status !== 'authenticated') return;
    let cancelled = false;
    getItem<boolean>(StorageKeys.HAS_COMPLETED_POST_AUTH_ONBOARDING).then(seen => {
      if (!cancelled) setPostAuthOnboardingSeen(!!seen);
    });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const showPostAuthOnboarding = status === 'authenticated' && postAuthOnboardingSeen === false;

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
    // The walkthrough's own last slide already offers a "Verify Now" CTA —
    // don't stack this modal on top of it for brand-new users.
    if (showPostAuthOnboarding) return;
    if (needsKycPrompt && !kycPromptDismissed) {
      setShowKycPrompt(true);
    } else {
      setShowKycPrompt(false);
    }
  }, [status, needsKycPrompt, kycPromptDismissed, showPostAuthOnboarding]);

  // Show splash while loading — including the brief gap right after a fresh
  // login while we check whether this account still needs the post-auth
  // onboarding, so Main never flashes before the walkthrough does.
  if (
    !ready ||
    status === 'initializing' ||
    (status === 'authenticated' && postAuthOnboardingSeen === null)
  ) {
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
            {/* First-launch-after-signup only: language confirm -> country
                pick -> feature walkthrough, declared first so they're the
                initial route whenever this becomes true. */}
            {showPostAuthOnboarding && (
              <>
                <Stack.Screen
                  name="PostAuthLanguageSelect"
                  component={LanguageSelectScreen}
                  initialParams={{ nextScreen: 'PostAuthCountrySelect' }}
                />
                <Stack.Screen
                  name="PostAuthCountrySelect"
                  component={CountrySelectScreen}
                  initialParams={{ nextScreen: 'PostAuthWalkthrough' }}
                />
                <Stack.Screen name="PostAuthWalkthrough" component={WelcomeWalkthroughScreen} />
              </>
            )}
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
            <Typo variant="subheading">{t('kycPromptModal.title')}</Typo>
            <Typo variant="caption">
              {t('kycPromptModal.message')}
            </Typo>
            <AppButton
              title={t('kycPromptModal.uploadDocuments')}
              onPress={() => {
                setShowKycPrompt(false);
                setKycPromptDismissed(true);
                navigate('KYCFlow', { screen: 'KycStatus' });
              }}
            />
            <AppButton
              title={t('kycPromptModal.skipForNow')}
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
