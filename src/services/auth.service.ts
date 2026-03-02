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

type ForgotPasswordPayload = {
  email: string;
};

type VerifyResetOtpPayload = {
  email: string;
  otp: string;
};

type ResetPasswordPayload = {
  // userId: string;
  // password: string;
  email: string;
  password: string;
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

export async function logoutUser() {
  const response = await api.post('/auth/logout');
  return response.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const response = await api.post('/auth/forgot-password', payload);
  return response.data;
}

export async function verifyResetOtp(payload: VerifyResetOtpPayload) {
  const response = await api.post('/auth/verify-reset-otp', payload);
  return response.data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await api.post('/auth/reset-password', payload);
  return response.data;
}

export async function resendForgotPasswordOtp(email: string) {
  const response = await api.post('/auth/forgot-password/resend', { email });
  return response.data;
}
