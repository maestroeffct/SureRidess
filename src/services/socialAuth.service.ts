import { Platform } from 'react-native';
import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { api } from './api';

type SocialProvider = {
  provider: 'google' | 'facebook' | 'apple';
  enabled: boolean;
  clientId: string;
  callbackUrl: string;
  isImplemented: boolean;
};

type SocialProvidersResponse = {
  providers: SocialProvider[];
};

export type GoogleBackendAuthResponse = {
  status: 'success';
  token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  isNewUser: boolean;
  needsProfileCompletion: boolean;
};

let configuredGoogleClientId: string | null = null;

async function getGoogleProviderConfig() {
  const response = await api.get<SocialProvidersResponse>('/auth/social/providers');
  const googleProvider = response.data.providers.find(
    provider => provider.provider === 'google',
  );

  if (!googleProvider || !googleProvider.enabled || !googleProvider.isImplemented) {
    throw new Error('Google sign-in is not enabled right now');
  }

  if (!googleProvider.clientId) {
    throw new Error('Google sign-in is not configured');
  }

  return googleProvider;
}

async function ensureGoogleConfigured(webClientId: string) {
  if (configuredGoogleClientId === webClientId) {
    return;
  }

  GoogleSignin.configure({
    webClientId,
    scopes: ['email', 'profile'],
    offlineAccess: false,
  });

  configuredGoogleClientId = webClientId;
}

export async function signInOrSignUpWithGoogle() {
  const googleProvider = await getGoogleProviderConfig();
  await ensureGoogleConfigured(googleProvider.clientId);

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
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

  const response = await api.post<GoogleBackendAuthResponse>('/auth/social/google', {
    idToken,
  });

  return response.data;
}

export function getGoogleAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message === 'GOOGLE_SIGN_IN_CANCELLED') {
      return 'Google sign-in was cancelled';
    }

    const axiosMessage = (error as any)?.response?.data?.message;
    if (typeof axiosMessage === 'string' && axiosMessage.trim()) {
      return axiosMessage;
    }

    if (error.message.trim()) {
      return error.message;
    }
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
