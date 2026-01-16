import { api } from './api';

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  country: string;
  dob: string; // ISO format
};

type LoginPayload = {
  email: string;
  password: string;
};

type VerifyOtpPayload = {
  userId: string;
  code: string;
};

export async function registerUser(payload: RegisterPayload) {
  const response = await api.post('/auth/register', payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload) {
  const response = await api.post('/auth/login', payload);
  return response.data;
}

export async function verifyOtp(payload: VerifyOtpPayload) {
  const response = await api.post('/auth/verify-otp', payload);
  return response.data;
}
