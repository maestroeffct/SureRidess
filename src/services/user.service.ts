import { api } from './api';

export async function fetchMe() {
  const response = await api.get('/auth/me');
  const payload = response.data;

  // Backend may return either { user: {...} } or just {...}
  return payload?.user ?? payload;
}

export async function updateProfile(data: {
  firstName?: string;
  lastName?: string;
  phoneCountry?: string;
  phoneNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
}) {
  const response = await api.patch('/users/me', data);
  return response.data;
}

export async function updatePassword(data: {
  oldPassword: string;
  newPassword: string;
}) {
  const response = await api.patch('/users/me/password', data);
  return response.data;
}
