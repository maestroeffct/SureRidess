import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  SmileID,
  SmileIDSmartSelfieAuthenticationView,
} from '@smile_identity/react-native';
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
  signSmileIdentityJob,
  type SmileSignedSpec,
} from '@/services/kyc.service';

type Stage = 'intro' | 'launching' | 'sdk' | 'polling' | 'done' | 'error';

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 30000;

export default function FaceLivenessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();

  const [stage, setStage] = useState<Stage>('intro');
  const [spec, setSpec] = useState<SmileSignedSpec | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard against setting state after unmount when a poll resolves late.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize the Smile SDK once. Uses sandbox unless the returned spec
  // says otherwise (we don't know the env until /sign responds, but the
  // native SDK also reads it per-call from the view props).
  useEffect(() => {
    (async () => {
      try {
        await SmileID.initialize(true, false);
      } catch (err) {
        if (__DEV__) console.log('[FaceLiveness] SmileID.initialize failed', err);
      }
    })();
  }, []);

  const continueToDocuments = useCallback(() => {
    navigation.navigate('Documents', route.params ?? {});
  }, [navigation, route.params]);

  const startVerification = async () => {
    try {
      setStage('launching');
      setErrorMessage(null);
      const signed = await signSmileIdentityJob('SMART_SELFIE_AUTHENTICATION');
      if (!mountedRef.current) return;
      setSpec(signed);
      setStage('sdk');
    } catch (err: any) {
      if (!mountedRef.current) return;
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to start face verification';
      setErrorMessage(message);
      setStage('error');
      showError(message);
    }
  };

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
          status.smileVerdict === 'APPROVED' ||
          status.smileVerdict === 'NEEDS_REVIEW'
        ) {
          showSuccess(
            status.smileVerdict === 'APPROVED'
              ? 'Face verified'
              : 'Verification received — moving on',
          );
          setStage('done');
          continueToDocuments();
          return;
        }
        if (status.smileVerdict === 'REJECTED') {
          setErrorMessage(
            'Face verification failed. Please try again in a well-lit area.',
          );
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
    showSuccess(
      'Still processing your face check. You can continue and we\'ll finalise it in the background.',
    );
    setStage('done');
    continueToDocuments();
  }, [continueToDocuments]);

  const handleSdkResult = (event: any) => {
    if (__DEV__) console.log('[FaceLiveness] SDK result', event);
    // The RN wrapper emits either a plain success payload or an error.
    // We treat anything with a truthy `error` field as failure and every
    // other resolved event as "SDK finished — now poll the backend for
    // the webhook-driven verdict."
    const isError =
      event &&
      (event.error ||
        event.errorCode ||
        (typeof event === 'object' && 'success' in event && event.success === false));
    if (isError) {
      const message =
        (event && (event.error || event.message || event.errorMessage)) ||
        'Face verification was cancelled or failed';
      setErrorMessage(String(message));
      setStage('error');
      return;
    }
    startPolling();
  };

  return (
    <ScreenWrapper padded={false}>
      <KYCStepHeader
        step={3}
        title="Face Verification"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {stage === 'sdk' && spec ? (
          <View style={styles.sdkFrame}>
            <SmileIDSmartSelfieAuthenticationView
              userId={spec.partner_params.user_id}
              showInstructions
              showAttribution
              showConfirmation
              allowAgentMode={false}
              extraPartnerParams={{
                signature: spec.signature,
                timestamp: spec.timestamp,
                callback_url: spec.callback_url,
                job_id: spec.partner_params.job_id,
                job_type: spec.partner_params.job_type,
                env: spec.env,
                partner_id: spec.partner_id,
              }}
              onResult={handleSdkResult}
              style={StyleSheet.absoluteFill}
            />
          </View>
        ) : (
          <>
            <KYCInfoAlert message="We use Smile Identity to confirm you're a real person. Your selfie stays encrypted and is only used for verification." />

            <View style={styles.copyBlock}>
              <Typo variant="subheading" style={{ marginBottom: Spacing.sm }}>
                Before you start
              </Typo>
              <Typo variant="body" color={colors.textSecondary}>
                {'•'} Find a well-lit spot{'\n'}
                {'•'} Remove hats, sunglasses or masks{'\n'}
                {'•'} Hold your phone at eye level{'\n'}
                {'•'} Follow the on-screen prompts
              </Typo>
            </View>

            {stage === 'polling' && (
              <View style={styles.copyBlock}>
                <Typo variant="body" color={colors.textSecondary}>
                  Waiting for Smile Identity to finalise the check...
                </Typo>
              </View>
            )}

            {stage === 'error' && (
              <View style={styles.copyBlock}>
                <Typo variant="body" color="#c0392b">
                  {errorMessage ?? 'Something went wrong.'}
                </Typo>
              </View>
            )}

            {stage === 'intro' || stage === 'launching' ? (
              <AppButton
                title="Start verification"
                loading={stage === 'launching'}
                onPress={startVerification}
                style={styles.button}
              />
            ) : null}

            {stage === 'polling' && (
              <AppButton
                title="Continue anyway"
                variant="outline"
                onPress={continueToDocuments}
                style={styles.button}
              />
            )}

            {stage === 'error' && (
              <>
                <AppButton
                  title="Retry"
                  onPress={startVerification}
                  style={styles.button}
                />
                <AppButton
                  title="Skip for now"
                  variant="outline"
                  onPress={continueToDocuments}
                  style={styles.buttonSecondary}
                />
              </>
            )}
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
  sdkFrame: {
    height: 560,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
