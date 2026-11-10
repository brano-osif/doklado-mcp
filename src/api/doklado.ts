import { apiBaseUrl, apiKey, ico } from '../config.ts';
import type {
  DokladoCallOptions,
  DokladoResponse,
  Organization,
} from '../types/index.ts';
import { apiError, commonHints, requestJson } from '../utils/request.ts';

export async function callDoklado(
  path: string,
  data: Record<string, unknown>,
  options: DokladoCallOptions = {},
) {
  const { response, body } = await requestJson<DokladoResponse>(
    apiBaseUrl + path,
    {
      method: 'POST',
      headers: {
        api_key: apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ data: { ...data, organizationId: ico } }),
    },
    options.mutating,
  );

  if (options.isListing && body.code === 'APP_NO_MORE_DATA') {
    return { ...body, data: [] };
  }
  if (!response.ok || body.success === false) {
    throw apiError(response, body, commonHints);
  }

  return body;
}

export async function fetchOwnDic() {
  const body = await callDoklado(
    '/v3/organization/manage/list',
    { identificationNumber: ico },
    { isListing: true },
  );
  const organizations: Organization[] = body.data?.documents ?? [];
  const own = organizations.find(org => org.identificationNumber === ico);

  if (!own?.taxIdentificationNumber) {
    throw new Error(
      `No DIČ found in Doklado for IČO ${ico}, fill it in Nastavenia firmy → Základné údaje`,
    );
  }

  return own.taxIdentificationNumber;
}
