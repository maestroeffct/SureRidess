export type RentalCarImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export type RentalCarProvider = {
  id: string;
  name: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  isVerified?: boolean;
};

export type RentalCarFeature = {
  id: string;
  name: string;
  category?: string;
  icon?: string;
};

export type RentalCarFeatureLink = {
  feature?: RentalCarFeature | null;
};

export type RentalInsurancePackage = {
  id: string;
  name: string;
  description?: string;
  dailyRate?: number;
  price?: number;
  amount?: number;
  currency?: string;
};

export type RentalCarLocation = {
  id: string;
  name: string;
  address?: string;
};

export type RentalCar = {
  id: string;
  brand: string;
  model: string;
  category?: string;
  year?: number;
  bags?: number | string;
  dailyRate: number;
  hourlyRate?: number;
  hasAC?: boolean;
  isActive?: boolean;
  mileagePolicy?: string;
  transmission?: string;
  seats?: number;
  provider: RentalCarProvider;
  location: RentalCarLocation;
  locationId?: string;
  providerId?: string;
  images: RentalCarImage[];
  features?: Array<RentalCarFeature | RentalCarFeatureLink>;
  groupedFeatures?: Record<string, RentalCarFeature[]>;
  insurancePackages?: RentalInsurancePackage[];
};

export type RentalSearchParams = {
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupAt: string;
  returnAt: string;
  countryCode: string;
};

export type RentalSearchResult = {
  search: {
    pickupAt: string;
    returnAt: string;
    countryCode: string;
  };
  total: number;
  cars: RentalCar[];
};

export type RentalLocationCountry = {
  id: string;
  name: string;
  code: string;
};

export type RentalLocationProvider = {
  id: string;
  name: string;
};

export type RentalLocation = {
  id: string;
  name: string;
  address: string;
  countryId?: string;
  providerId?: string;
  country?: RentalLocationCountry;
  provider?: RentalLocationProvider;
};

export type RentalLocationSearchParams = {
  q: string;
  countryId: string;
};
