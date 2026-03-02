import axios from 'axios';
import { Platform } from 'react-native';
import { getItem, StorageKeys } from '@/helpers/storage';

const BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

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

    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.log('Unauthorized access - redirecting to login');
    }
    return Promise.reject(error);
  },
);
