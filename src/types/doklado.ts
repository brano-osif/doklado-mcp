export type DokladoResponse = {
  success?: boolean;
  code?: string;
  message?: string;
  data?: any;
  searchAfter?: unknown[];
};

export type DokladoCallOptions = {
  mutating?: boolean;
  isListing?: boolean;
};

export type Organization = {
  identificationNumber: string;
  taxIdentificationNumber?: string;
};
