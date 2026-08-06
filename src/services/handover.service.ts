import { api } from './api';

export type HandoverType = 'PICKUP' | 'RETURN';

/**
 * Uploads the customer's in-app signature for a given booking + handover
 * type. Accepts a data URI (what react-native-signature-canvas emits) and
 * repackages it as multipart form-data so the backend can persist the
 * PNG through the shared storage driver (Cloudinary / S3 / local).
 */
export async function submitHandoverSignature(
  bookingId: string,
  type: HandoverType,
  imageDataUri: string,
) {
  // Data URI shape: "data:image/png;base64,iVBORw0KG..." — strip the
  // header, decode the base64 in-memory, and hand the raw bytes to
  // FormData. Using `fetch()` on the data URI would also work but this
  // avoids a redundant network round-trip through the RN bridge.
  const match = imageDataUri.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid signature image');
  }
  const contentType = match[1];
  // React Native's FormData accepts a `{ uri, name, type }` shape and
  // handles the encoding itself — passing the data URI directly is the
  // most reliable path across Android and iOS.
  const ext = contentType.split('/')[1] || 'png';
  const form = new FormData();
  form.append('file', {
    uri: imageDataUri,
    name: `signature.${ext}`,
    type: contentType,
  } as any);

  const response = await api.post(
    `/bookings/${bookingId}/handovers/${type}/signature`,
    form,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Signature uploads can take a beat on slow networks — give them
      // more room than the default 10s.
      timeout: 30000,
    },
  );

  return response.data as {
    handover: {
      id: string;
      type: HandoverType;
      signedByCustomer: boolean;
      customerSignatureUrl: string | null;
      customerSignedAt: string | null;
    };
  };
}
