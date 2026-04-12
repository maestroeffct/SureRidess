import axios from 'axios';
// import { Platform } from 'react-native';
import { getItem, StorageKeys } from '@/helpers/storage';

export type AuthErrorReason =
  | 'UNAUTHORIZED'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_UNVERIFIED';

let authErrorHandler:
  | ((reason: AuthErrorReason) => void | Promise<void>)
  | null = null;

export function setAuthErrorHandler(
  handler: ((reason: AuthErrorReason) => void | Promise<void>) | null,
) {
  authErrorHandler = handler;
}

// const BASE_URL =
//   Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

const BASE_URL = 'https://sureride-backend-production.up.railway.app';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const LOG_API = true;

// 🔐 Attach token automatically
api.interceptors.request.use(async config => {
  const token = await getItem<string>(StorageKeys.AUTH_TOKEN);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (LOG_API) {
    const method = (config.method || 'GET').toUpperCase();
    console.log('[API][Request]', method, config.url, {
      params: config.params,
      data: config.data,
    });
  }

  return config;
});

// 🛑 Handle unauthorized globally
api.interceptors.response.use(
  response => {
    if (LOG_API) {
      console.log('[API][Response]', response.status, response.config.url, {
        data: response.data,
      });
    }
    return response;
  },
  async error => {
    if (LOG_API) {
      console.log('[API][Error]', error?.response?.status, error?.config?.url, {
        data: error?.response?.data,
      });
    }

    const status = error?.response?.status;
    const code = String(error?.response?.data?.code || '').toUpperCase();

    if (status === 401) {
      console.log('Unauthorized access - redirecting to login');
      authErrorHandler?.('UNAUTHORIZED');
    }

    if (status === 403 && code === 'ACCOUNT_SUSPENDED') {
      console.log('Account suspended - forcing logout');
      authErrorHandler?.('ACCOUNT_SUSPENDED');
    }

    if (status === 403 && code === 'ACCOUNT_UNVERIFIED') {
      console.log('Account unverified - forcing logout');
      authErrorHandler?.('ACCOUNT_UNVERIFIED');
    }

    return Promise.reject(error);
  },
);
