import { api } from './api';
import type { Asset } from 'react-native-image-picker';

export type SaveKycPersonalInfoPayload = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string; // YYYY-MM-DD
  nationality: string;
  phoneCountry: string;
  phoneNumber: string;
};

export type SaveKycAddressPayload = {
  state: string;
  region: string;
  homeAddress: string;
};

export type UploadKycDocumentsPayload = {
  passport: Asset;
  govFront: Asset;
  govBack: Asset;
  licenseFront: Asset;
  licenseBack: Asset;
  governmentIdType?: string;
  governmentIdNumber?: string;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
};

function assetToFormFile(asset: Asset) {
  if (!asset.uri) {
    throw new Error('Selected image has no URI');
  }

  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    name: asset.fileName || `upload-${Date.now()}.jpg`,
  } as any;
}

export async function saveKycPersonalInfo(payload: SaveKycPersonalInfoPayload) {
  const response = await api.post('/kyc/personal', payload);
  return response.data;
}

export async function saveKycAddressInfo(payload: SaveKycAddressPayload) {
  const response = await api.post('/kyc/address', payload);
  return response.data;
}

export type SmileJobType =
  | 'BASIC_KYC'
  | 'SMART_SELFIE_AUTHENTICATION'
  | 'ENHANCED_KYC';

export type SmileSignedSpec = {
  partner_id: string;
  timestamp: string;
  signature: string;
  partner_params: {
    user_id: string;
    job_id: string;
    job_type: SmileJobType;
  };
  callback_url: string;
  env: 'sandbox' | 'production';
};

export type SmileVerdict = 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';

export type KycStatusResponse = {
  profileStatus: 'INCOMPLETE' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  kycStatus: string | null;
  smileJobId: string | null;
  smileVerdict: SmileVerdict | null;
  smileConfidenceScore: number | null;
};

export async function signSmileIdentityJob(jobType: SmileJobType) {
  const response = await api.post<SmileSignedSpec>('/kyc/smile-identity/sign', {
    jobType,
  });
  return response.data;
}

export async function fetchKycStatus() {
  const response = await api.get<KycStatusResponse>('/kyc/status');
  return response.data;
}

export async function uploadKycDocuments(payload: UploadKycDocumentsPayload) {
  const formData = new FormData();

  formData.append('passport', assetToFormFile(payload.passport));
  formData.append('govFront', assetToFormFile(payload.govFront));
  formData.append('govBack', assetToFormFile(payload.govBack));
  formData.append('licenseFront', assetToFormFile(payload.licenseFront));
  formData.append('licenseBack', assetToFormFile(payload.licenseBack));

  if (payload.governmentIdType) {
    formData.append('governmentIdType', payload.governmentIdType);
  }
  if (payload.governmentIdNumber) {
    formData.append('governmentIdNumber', payload.governmentIdNumber);
  }
  if (payload.driverLicenseNumber) {
    formData.append('driverLicenseNumber', payload.driverLicenseNumber);
  }
  if (payload.driverLicenseExpiry) {
    formData.append('driverLicenseExpiry', payload.driverLicenseExpiry);
  }

  const response = await api.post('/kyc/documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}
