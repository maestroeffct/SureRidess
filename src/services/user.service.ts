import { api } from './api';

export async function fetchMe() {
  const response = await api.get('/auth/me');
  const payload = response.data;

  // Backend may return either { user: {...} } or just {...}
  return payload?.user ?? payload;
}
