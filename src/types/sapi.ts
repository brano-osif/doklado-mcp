export type Token = {
  value: string;
  expiresAt: number;
};

export type TokenResponse = {
  access_token?: string;
  expires_in?: number;
};

export type Query = Record<string, string | number | undefined>;

export type SapiRequest = {
  method: 'GET' | 'POST';
  path: string;
  query?: Query;
  body?: object;
  headers?: Record<string, string>;
  mutating?: boolean;
};

export type LookupResponse = {
  found: boolean;
  participant: { participantId: string } | null;
};

export type ReceivedListQuery = {
  status?: 'RECEIVED' | 'ACKNOWLEDGED';
  limit?: number;
  pageToken?: string;
};

export type ReceivedDocument = {
  payload?: string;
  metadata?: unknown;
};

export type EinvoiceToSend = {
  xml: string;
  receiverDic: string;
  documentId: string;
};
