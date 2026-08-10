import { Platform } from 'react-native';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_WEB_CLIENT_ID } from '@env';
import { api } from './api';
import type { User } from '@/providers/AuthProvider';

// Wire format returned by POST /auth/google. Mirrors POST /auth/login so
// the caller can hand `{ token, user }` straight to AuthProvider.login.
export type GoogleBackendAuthResponse = {
  status: 'success';
  token: string;
  user: User;
  isNewUser: boolean;
  needsProfileCompletion: boolean;
};

let configuredGoogleClientId: string | null = null;

function ensureGoogleConfigured() {
  const clientId = (GOOGLE_WEB_CLIENT_ID || '').trim();

  if (!clientId) {
    // Fail loudly here — if this env var is missing the sign-in flow will
    // silently return a token with the wrong `aud`, and the backend will
    // reject it with a cryptic UNAUTHORIZED. Better to surface the
    // configuration bug directly.
    throw new Error('GOOGLE_WEB_CLIENT_ID_MISSING');
  }

  if (configuredGoogleClientId === clientId) return;

  // `webClientId` is required even on iOS — it's what makes GoogleSignin
  // return an ID token we can verify server-side against the same client id.
  GoogleSignin.configure({
    webClientId: clientId,
    scopes: ['email', 'profile'],
    offlineAccess: false,
  });

  configuredGoogleClientId = clientId;
}

export async function signInWithGoogle(): Promise<GoogleBackendAuthResponse> {
  ensureGoogleConfigured();

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const result = await GoogleSignin.signIn();

  if (isCancelledResponse(result)) {
    throw new Error('GOOGLE_SIGN_IN_CANCELLED');
  }

  if (!isSuccessResponse(result)) {
    throw new Error('Google sign-in did not complete');
  }

  const idToken =
    result.data.idToken ?? (await GoogleSignin.getTokens()).idToken;

  if (!idToken) {
    throw new Error('Google sign-in did not return an ID token');
  }

  const response = await api.post<GoogleBackendAuthResponse>('/auth/google', {
    idToken,
  });

  return response.data;
}

export function getGoogleAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === 'GOOGLE_SIGN_IN_CANCELLED') {
      return 'Google sign-in was cancelled';
    }

    if (error.message === 'GOOGLE_WEB_CLIENT_ID_MISSING') {
      return 'Google sign-in is not configured on this build';
    }

    const axiosMessage = (error as any)?.response?.data?.message;
    if (typeof axiosMessage === 'string' && axiosMessage.trim()) {
      return axiosMessage;
    }

    if (error.message.trim()) return error.message;
  }

  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play Services is not available on this device';
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return 'Google sign-in is already in progress';
    }
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      return 'Google sign-in was cancelled';
    }
  }

  return 'Google sign-in failed';
}
