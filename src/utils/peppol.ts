import { createHash } from 'node:crypto';

export const INVOICE_TYPE_ID =
  'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1';

export const CREDIT_NOTE_TYPE_ID =
  'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2::CreditNote##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1';

export const BILLING_PROCESS_ID = 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0';

export function sha256(text: string) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function toPeppolId(dic: string) {
  return `0245:${dic.replace(/^SK/i, '')}`;
}

export function toUuid(hex: string) {
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

const ROOT_ELEMENT =
  /^\uFEFF?\s*(?:<\?[\s\S]*?\?>\s*|<!--[\s\S]*?-->\s*)*<(?:[\w.-]+:)?([\w.-]+)/;

export function isCreditNote(xml: string) {
  return xml.match(ROOT_ELEMENT)?.[1] === 'CreditNote';
}
