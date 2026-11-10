import type { Hints } from '../types/index.ts';

const TIMEOUT_MS = 30_000;

export const commonHints: Hints = {
  400: 'Invalid request or parameter format.',
  401: 'Credentials rejected. Check the API key or SAPI client id/secret for this environment.',
  403: 'Not authorized for this organization, participant or endpoint.',
  404: 'Not found. Check the document id.',
  429: 'Usage or rate limit reached (Prehľad účtu → API prepojenia).',
};

function describeNetworkError(error: Error, mutating: boolean) {
  const reason = error.name === 'TimeoutError' ? 'timeout' : error.message;
  const warning = mutating
    ? ' The request may have gone through. Do NOT retry before verifying the result.'
    : '';

  return `Request failed (${reason}).${warning}`;
}

function parseBody(text: string): unknown {
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500) };
  }
}

export async function requestJson<T>(
  url: string,
  init: RequestInit,
  mutating = false,
) {
  let response: Response;
  let text: string;

  try {
    response = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    text = await response.text();
  } catch (error) {
    throw new Error(describeNetworkError(error as Error, mutating));
  }

  return { response, body: parseBody(text) as T };
}

export function apiError(response: Response, body: unknown, hints: Hints) {
  const details = {
    http: response.status,
    hint: hints[response.status],
    ...(body as object),
  };

  return new Error(JSON.stringify(details));
}
