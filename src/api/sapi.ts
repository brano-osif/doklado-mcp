import { sapiBaseUrl, sapiClientId, sapiSecret } from '../config.ts';
import type {
  EinvoiceToSend,
  Hints,
  LookupResponse,
  Query,
  ReceivedDocument,
  ReceivedListQuery,
  SapiRequest,
  Token,
  TokenResponse,
} from '../types/index.ts';
import {
  BILLING_PROCESS_ID,
  CREDIT_NOTE_TYPE_ID,
  INVOICE_TYPE_ID,
  isCreditNote,
  sha256,
  toPeppolId,
  toUuid,
} from '../utils/peppol.ts';
import { apiError, commonHints, requestJson } from '../utils/request.ts';
import { fetchOwnDic } from './doklado.ts';

const sapiHints: Hints = {
  ...commonHints,
  409: 'This invoice number was already submitted to this customer. Do not resend, check its status in the Doklado web app. If the earlier attempt was rejected (422) and only the fixed XML gets 409, contact Doklado support.',
  422: 'The XML failed e-invoice (Peppol BIS 3) validation. Fix the reported issues.',
  423: 'SAPI client is temporarily locked.',
  503: 'Peppol network temporarily unavailable. Safe to retry later.',
};

const TOKEN_SAFETY_MARGIN_SECONDS = 60;

let cachedToken: Token | undefined;
let tokenRequest: Promise<Token> | undefined;
let ownParticipant: Promise<string> | undefined;

async function fetchToken(): Promise<Token> {
  const { response, body } = await requestJson<TokenResponse>(
    `${sapiBaseUrl}/sapi/auth/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: sapiClientId,
        client_secret: sapiSecret,
        grant_type: 'client_credentials',
      }),
    },
  );

  if (!response.ok || !body.access_token) {
    throw apiError(response, body, sapiHints);
  }

  const lifetimeSeconds = body.expires_in ?? 900;
  const usableMs = (lifetimeSeconds - TOKEN_SAFETY_MARGIN_SECONDS) * 1000;

  return { value: body.access_token, expiresAt: Date.now() + usableMs };
}

async function getToken(refresh: boolean) {
  const expired = !cachedToken || Date.now() >= cachedToken.expiresAt;
  if (refresh || expired) {
    tokenRequest ??= fetchToken().finally(() => {
      tokenRequest = undefined;
    });
    cachedToken = await tokenRequest;
  }

  return cachedToken!.value;
}

function getOwnParticipant() {
  ownParticipant ??= fetchOwnDic()
    .then(toPeppolId)
    .catch(error => {
      ownParticipant = undefined;
      throw error;
    });

  return ownParticipant;
}

function toQueryString(query: Query = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }

  const text = params.toString();
  return text ? `?${text}` : '';
}

async function sapi<T = unknown>(
  request: SapiRequest,
  isRetry = false,
): Promise<T> {
  const url = sapiBaseUrl + request.path + toQueryString(request.query);
  const headers = {
    Authorization: `Bearer ${await getToken(isRetry)}`,
    'X-Peppol-Participant-Id': await getOwnParticipant(),
    Accept: 'application/json',
    ...(request.body && { 'Content-Type': 'application/json' }),
    ...request.headers,
  };

  const { response, body } = await requestJson<T>(
    url,
    {
      method: request.method,
      headers,
      body: request.body && JSON.stringify(request.body),
    },
    request.mutating,
  );

  if (response.status === 401 && !isRetry) return sapi<T>(request, true);
  if (!response.ok) throw apiError(response, body, sapiHints);

  return body;
}

export function lookupParticipant(dic: string) {
  return sapi<LookupResponse>({
    method: 'GET',
    path: '/sapi-plus/participant/lookup',
    query: { dic },
  });
}

export function listReceived(query: ReceivedListQuery) {
  return sapi({ method: 'GET', path: '/sapi/document/receive', query });
}

export function getReceived(documentId: string) {
  return sapi<ReceivedDocument>({
    method: 'GET',
    path: `/sapi/document/receive/${encodeURIComponent(documentId)}`,
  });
}

export function acknowledgeReceived(documentId: string) {
  return sapi({
    method: 'POST',
    path: `/sapi/document/receive/${encodeURIComponent(documentId)}/acknowledge`,
    mutating: true,
  });
}

export async function sendEinvoice({
  xml,
  receiverDic,
  documentId,
}: EinvoiceToSend) {
  const lookup = await lookupParticipant(receiverDic);

  if (!lookup.found || !lookup.participant) {
    throw new Error(
      `DIČ ${receiverDic} is not registered in Peppol and cannot receive e-invoices. Send the PDF by email instead.`,
    );
  }

  const sender = await getOwnParticipant();
  const receiver = lookup.participant.participantId;
  const idempotencyKey = toUuid(
    sha256(`${sender}\n${receiver}\n${documentId}`),
  );

  return sapi({
    method: 'POST',
    path: '/sapi/document/send',
    mutating: true,
    headers: { 'Idempotency-Key': idempotencyKey },
    body: {
      metadata: {
        documentId,
        documentTypeId: isCreditNote(xml)
          ? CREDIT_NOTE_TYPE_ID
          : INVOICE_TYPE_ID,
        processId: BILLING_PROCESS_ID,
        senderParticipantId: sender,
        receiverParticipantId: receiver,
        creationDateTime: new Date().toISOString(),
      },
      payload: xml,
      payloadFormat: 'XML',
      payloadEncoding: 'UTF-8',
      checksum: sha256(xml),
    },
  });
}
