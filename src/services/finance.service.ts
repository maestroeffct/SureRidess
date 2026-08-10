import { api } from './api';

export type MyFine = {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  category: string;
  status: 'PENDING' | 'OVERDUE' | 'PAID' | 'WAIVED' | 'DISPUTED';
  reason: string;
  dueDate: string | null;
  createdAt: string;
  booking: { id: string; car: { brand: string; model: string } } | null;
};

export type MyDamageClaim = {
  id: string;
  description: string;
  estimatedCost: number;
  currency: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';
  resolutionNote: string | null;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    car: { brand: string; model: string };
    returnAt: string;
  };
  fine: { id: string; amount: number; status: string; reference: string } | null;
};

export type MyDeposit = {
  id: string;
  amount: number;
  currency: string;
  status: 'AUTHORIZED' | 'CAPTURED' | 'RELEASED' | 'FAILED';
  capturedAmount: number | null;
  failureReason: string | null;
  authorizedAt: string | null;
  capturedAt: string | null;
  releasedAt: string | null;
  booking: {
    id: string;
    car: { brand: string; model: string };
    pickupAt: string;
    returnAt: string;
  };
};

export type MyFinanceOverview = {
  fines: MyFine[];
  damageClaims: MyDamageClaim[];
  deposits: MyDeposit[];
  totals: {
    outstandingFines: number;
    heldDeposit: number;
    currency: string;
  };
};

export async function getMyFinanceOverview(): Promise<MyFinanceOverview> {
  const response = await api.get<MyFinanceOverview>('/me/finance');
  return response.data;
}
