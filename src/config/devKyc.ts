import { DEV_BYPASS_KYC } from '@env';

export const DEV_BYPASS_KYC_VERIFICATION = __DEV__ && DEV_BYPASS_KYC === 'true';
