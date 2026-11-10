function isUnfilledPlaceholder(value: string) {
  return value.startsWith('${');
}

function read(name: string) {
  const value = process.env[name]?.trim();
  return value && !isUnfilledPlaceholder(value) ? value : undefined;
}

function flag(name: string) {
  return /^(1|true|yes)$/i.test(read(name) ?? '');
}

function required(name: string) {
  const value = read(name);

  if (!value) {
    console.error(`doklado-mcp: ${name} must be set`);
    process.exit(1);
  }

  return value;
}

export const apiKey = required('DOKLADO_API_KEY');
export const ico = required('DOKLADO_ICO').replace(/\s/g, '');
export const sandbox = flag('DOKLADO_SANDBOX');
export const allowIssue = flag('DOKLADO_ISSUE');
export const sapiClientId = read('DOKLADO_SAPI_CLIENT_ID');
export const sapiSecret = read('DOKLADO_SAPI_SECRET');
export const sapiEnabled = Boolean(sapiClientId && sapiSecret);

if (!sapiEnabled && (sapiClientId || sapiSecret)) {
  console.error(
    'doklado-mcp: e-faktura tools disabled, set both DOKLADO_SAPI_CLIENT_ID and DOKLADO_SAPI_SECRET',
  );
}

export const environmentLabel = sandbox ? 'SANDBOX' : 'PROD';

export const apiBaseUrl = sandbox
  ? 'https://doklado-einvoice-sandbox-cga5r5w8.ew.gateway.dev'
  : 'https://api-gateway-prod-europe-west-1-7epuecvu.ew.gateway.dev';

export const sapiBaseUrl = sandbox
  ? 'https://einvoice-v1-ynyiur6quq-ey.a.run.app/v1'
  : 'https://einvoice-v1-yuw5qbwq4a-ey.a.run.app/v1';
