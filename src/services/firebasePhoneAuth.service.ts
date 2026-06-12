import auth from '@react-native-firebase/auth';
import { api } from './api';

/**
 * Firebase Phone OTP — mobile-side wrapper.
 *
 * Flow:
 *   1. sendPhoneOtp(phone) → Firebase sends SMS, returns a verificationId
 *      (plain string — safe to pass through navigation params)
 *   2. confirmPhoneOtp(verificationId, code) → Firebase verifies, returns ID token
 *   3. verifyPhoneWithBackend(idToken, ...) → SureRide backend issues JWT
 *
 * IMPORTANT: we deliberately avoid stashing the ConfirmationResult in a
 * module-level singleton. That pattern doesn't survive React Navigation
 * mounts or Fast Refresh in dev mode — leading to NO_PENDING_OTP errors
 * when the verify screen calls confirm. Instead we extract the plain
 * verificationId string and rebuild the PhoneAuthCredential on demand.
 */

export async function sendPhoneOtp(phoneE164: string): Promise<string> {
  // Sanity strip — Firebase rejects spaces/dashes
  const cleaned = phoneE164.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+') || cleaned.length < 8) {
    throw new Error('PHONE_FORMAT_INVALID');
  }

  // forceResend=true so retries within the rate limit still go through
  const confirmation = await auth().signInWithPhoneNumber(cleaned, true);

  // The ConfirmationResult's verificationId is a serialisable string we
  // can shuttle through nav params. We don't keep the ConfirmationResult
  // itself anywhere — see big comment above.
  if (!confirmation.verificationId) {
    throw new Error('VERIFICATION_ID_MISSING');
  }
  return confirmation.verificationId;
}

export async function confirmPhoneOtp(
  verificationId: string,
  code: string,
): Promise<string> {
  if (!verificationId) {
    throw new Error('NO_PENDING_OTP');
  }
  const credential = auth.PhoneAuthProvider.credential(
    verificationId,
    code.trim(),
  );
  const userCred = await auth().signInWithCredential(credential);
  if (!userCred?.user) {
    throw new Error('VERIFICATION_FAILED');
  }
  const idToken = await userCred.user.getIdToken();
  // Sign out from Firebase immediately — we don't keep a Firebase session,
  // only the SureRide JWT. Prevents stale Firebase tokens from accumulating.
  await auth().signOut().catch(() => {});
  return idToken;
}

// ── Backend ────────────────────────────────────────────────────────────────

export type FirebaseVerifyResponse = {
  status: 'SUCCESS';
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    isNewUser: boolean;
  };
};

export async function verifyPhoneWithBackend(input: {
  idToken: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}): Promise<FirebaseVerifyResponse> {
  const { data } = await api.post<FirebaseVerifyResponse>(
    '/auth/firebase/verify-phone',
    {
      idToken: input.idToken,
      firstName: input.firstName?.trim() || undefined,
      lastName: input.lastName?.trim() || undefined,
      email: input.email?.trim().toLowerCase() || undefined,
    },
  );
  return data;
}
