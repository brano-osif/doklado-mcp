import { allowIssue, sapiEnabled } from '../config.ts';
import type { Tool } from '../types/index.ts';
import {
  getDocument,
  getInvoicePdf,
  issueInvoice,
  listDocuments,
  sendInvoiceByEmail,
  updateIssuedInvoice,
} from './doklado.ts';
import {
  einvoiceAcknowledge,
  einvoiceGetReceived,
  einvoiceListReceived,
  einvoiceLookup,
  sendEinvoiceTool,
} from './einvoice.ts';

const invoiceTools = [
  listDocuments,
  getDocument,
  ...(allowIssue ? [issueInvoice] : []),
  updateIssuedInvoice,
  getInvoicePdf,
  sendInvoiceByEmail,
];

const einvoiceTools = [
  einvoiceLookup,
  sendEinvoiceTool,
  einvoiceListReceived,
  einvoiceGetReceived,
  einvoiceAcknowledge,
];

export const tools: Tool[] = [
  ...invoiceTools,
  ...(sapiEnabled ? einvoiceTools : []),
];
