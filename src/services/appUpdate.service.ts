import { Platform } from 'react-native';
import { api } from './api';
import { CURRENT_BUILD_CODE } from '@/config/appVersion';

// Matches the JSON returned by GET /platform/app-update-policy
export type AppUpdatePolicy = {
  app: 'customer' | 'provider';
  platform: 'android' | 'ios';
  latest_version_name: string;
  latest_build_code: number;
  min_supported_build_code: number;
  force_update: boolean;
  store_url: string;
  title: string;
  message: string;
};

export type UpdateDecision =
  | { state: 'allowed' }
  | { state: 'soft_update'; policy: AppUpdatePolicy }
  | { state: 'force_update'; policy: AppUpdatePolicy };

export async function fetchUpdatePolicy(): Promise<AppUpdatePolicy | null> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const { data } = await api.get<AppUpdatePolicy>(
      '/platform/app-update-policy',
      { params: { app: 'customer', platform } },
    );
    return data;
  } catch {
    // Fail-open: if the policy endpoint is unreachable we let the app continue
    // rather than locking users out of a working build.
    return null;
  }
}

export function decideUpdate(
  policy: AppUpdatePolicy | null,
  currentBuild: number = CURRENT_BUILD_CODE,
): UpdateDecision {
  if (!policy) return { state: 'allowed' };

  if (policy.min_supported_build_code > 0 && currentBuild < policy.min_supported_build_code) {
    return { state: 'force_update', policy };
  }

  if (
    policy.latest_build_code > 0 &&
    currentBuild < policy.latest_build_code &&
    !policy.force_update
  ) {
    return { state: 'soft_update', policy };
  }

  return { state: 'allowed' };
}
