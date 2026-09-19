import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import SNSMobileSDK from '@sumsub/react-native-mobilesdk-module';
import { ScreenWrapper } from '@/components/Screenwrapper/Screenwrapper';
import { KYCStepHeader } from '@/components/kyc/KYCStepHeader/KYCStepHeader';
import { KYCInfoAlert } from '@/components/kyc/KYCInfoAlert/KYCInfoAlert';
import { AppButton } from '@/components/AppButton/CustomButton';
import { Typo } from '@/components/AppText/Typo';
import { Spacing } from '@/theme';
import { useTheme } from '@/theme/ThemeProvider';
import { showError, showSuccess } from '@/helpers/toast';
import {
  fetchKycStatus,
  getSumsubAccessToken,
} from '@/services/kyc.service';

type Stage = 'intro' | 'launching' | 'polling' | 'done' | 'error';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 30000;

export default function FaceLivenessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { t } = useTranslation('kyc');

  const [stage, setStage] = useState<Stage>('intro');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard against setting state after unmount when a poll resolves late.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const continueToDocuments = useCallback(() => {
    navigation.navigate('Documents', route.params ?? {});
  }, [navigation, route.params]);

  // Poll /kyc/status every POLL_INTERVAL_MS until the webhook lands a
  // verdict, or POLL_MAX_MS elapses. On timeout we let the user press
  // "Continue anyway" so a delayed webhook doesn't block onboarding.
  const startPolling = useCallback(async () => {
    setStage('polling');
    const started = Date.now();
    while (mountedRef.current && Date.now() - started < POLL_MAX_MS) {
      try {
        const status = await fetchKycStatus();
        if (!mountedRef.current) return;
        if (
          status.sumsubVerdict === 'APPROVED' ||
          status.sumsubVerdict === 'NEEDS_REVIEW'
        ) {
          showSuccess(
            status.sumsubVerdict === 'APPROVED'
              ? t('faceLivenessScreen.faceVerified')
              : t('faceLivenessScreen.verificationReceived'),
          );
          setStage('done');
          continueToDocuments();
          return;
        }
        if (status.sumsubVerdict === 'REJECTED') {
          setErrorMessage(t('faceLivenessScreen.errorFailedTryAgain'));
          setStage('error');
          return;
        }
      } catch (err) {
        if (__DEV__) console.log('[FaceLiveness] poll error', err);
      }
      await new Promise<void>(r => setTimeout(() => r(), POLL_INTERVAL_MS));
    }
    if (!mountedRef.current) return;
    // Timed out — soft-warn and let the user proceed. The webhook will
    // still land eventually and the dashboard can pick up the verdict.
    showSuccess(t('faceLivenessScreen.stillProcessing'));
    setStage('done');
    continueToDocuments();
  }, [continueToDocuments]);

  const startVerification = async () => {
    try {
      setStage('launching');
      setErrorMessage(null);

      const { token } = await getSumsubAccessToken();
      if (!mountedRef.current) return;

      const sdk = SNSMobileSDK.init(token, async () => {
        // Token expired mid-flow — mint a fresh one so the SDK can
        // continue without the user restarting.
        const refreshed = await getSumsubAccessToken();
        return refreshed.token;
      })
        .withHandlers({
          onStatusChanged: (event: any) => {
            if (__DEV__) {
              console.log(
                `[FaceLiveness] status: [${event.prevStatus}] => [${event.newStatus}]`,
              );
            }
          },
        })
        .withDebug(__DEV__)
        .build();

      const result = await sdk.launch();
      if (!mountedRef.current) return;
      if (__DEV__) console.log('[FaceLiveness] SDK result', result);

      if (result?.success === false) {
        const message =
          result?.errorMsg || t('faceLivenessScreen.errorCancelledOrFailed');
        setErrorMessage(String(message));
        setStage('error');
        return;
      }

      startPolling();
    } catch (err: any) {
      if (!mountedRef.current) return;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        t('faceLivenessScreen.errorFailedToStart');
      setErrorMessage(message);
      setStage('error');
      showError(message);
    }
  };

  return (
    <ScreenWrapper padded={false}>
      <KYCStepHeader
        step={3}
        title={t('faceLivenessScreen.title')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <KYCInfoAlert message={t('faceLivenessScreen.infoAlert')} />

        <View style={styles.copyBlock}>
          <Typo variant="subheading" style={{ marginBottom: Spacing.sm }}>
            {t('faceLivenessScreen.beforeYouStart')}
          </Typo>
          <Typo variant="body" color={colors.textSecondary}>
            {'•'} {t('faceLivenessScreen.tipWellLit')}{'\n'}
            {'•'} {t('faceLivenessScreen.tipRemoveAccessories')}{'\n'}
            {'•'} {t('faceLivenessScreen.tipEyeLevel')}{'\n'}
            {'•'} {t('faceLivenessScreen.tipFollowPrompts')}
          </Typo>
        </View>

        {stage === 'polling' && (
          <View style={styles.copyBlock}>
            <Typo variant="body" color={colors.textSecondary}>
              {t('faceLivenessScreen.waitingForCheck')}
            </Typo>
          </View>
        )}

        {stage === 'error' && (
          <View style={styles.copyBlock}>
            <Typo variant="body" color="#c0392b">
              {errorMessage ?? t('faceLivenessScreen.somethingWentWrong')}
            </Typo>
          </View>
        )}

        {stage === 'intro' || stage === 'launching' ? (
          <AppButton
            title={t('faceLivenessScreen.startVerification')}
            loading={stage === 'launching'}
            onPress={startVerification}
            style={styles.button}
          />
        ) : null}

        {stage === 'polling' && (
          <AppButton
            title={t('faceLivenessScreen.continueAnyway')}
            variant="outline"
            onPress={continueToDocuments}
            style={styles.button}
          />
        )}

        {stage === 'error' && (
          <>
            <AppButton
              title={t('faceLivenessScreen.retry')}
              onPress={startVerification}
              style={styles.button}
            />
            <AppButton
              title={t('faceLivenessScreen.skipForNow')}
              variant="outline"
              onPress={continueToDocuments}
              style={styles.buttonSecondary}
            />
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  copyBlock: {
    marginTop: Spacing.lg,
  },
  button: {
    marginTop: Spacing.xl,
  },
  buttonSecondary: {
    marginTop: Spacing.md,
  },
});
