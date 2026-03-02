// src/types/search.ts
export type DateTimeRange = {
  pickupDate: Date;
  pickupTime: Date;
  returnDate: Date;
  returnTime: Date;
};

export type SearchPayload = {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  country: {
    name: string;
    code: string;
  };
};
