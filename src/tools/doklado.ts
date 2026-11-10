import { callDoklado } from '../api/doklado.ts';
import type { Tool } from '../types/index.ts';
import { saveToDownloads } from '../utils/downloads.ts';
import { inputSchemaFor } from '../utils/schema.ts';
import { descriptions, type ToolName } from './descriptions.ts';

type PassThroughOptions = { mutating?: boolean; required?: string[] };

function passThroughTool(
  name: ToolName,
  path: string,
  { mutating = false, required = [] }: PassThroughOptions = {},
): Tool {
  return {
    name,
    description: descriptions[name],
    inputSchema: inputSchemaFor(path, required),
    run: async args => {
      const body = await callDoklado(path, args, { mutating });
      return body.data ?? body;
    },
  };
}

export const listDocuments: Tool = {
  name: 'list_documents',
  description: descriptions.list_documents,
  inputSchema: inputSchemaFor('/v2/documents'),
  run: async args => {
    const body = await callDoklado('/v2/documents', args, { isListing: true });
    const documents = body.data ?? [];
    const hasNextPage = documents.length > 0 && !!body.searchAfter?.length;

    return { documents, searchAfter: hasNextPage ? body.searchAfter : null };
  },
};

export const getDocument = passThroughTool(
  'get_document',
  '/v2/documents/get',
  {
    required: ['documentId'],
  },
);

export const issueInvoice = passThroughTool(
  'issue_invoice',
  '/v1/documents/invoice-issue',
  { mutating: true },
);

export const updateIssuedInvoice = passThroughTool(
  'update_issued_invoice',
  '/v1/documents/issued-invoice-update',
  { mutating: true, required: ['documentId'] },
);

export const sendInvoiceByEmail = passThroughTool(
  'send_invoice_by_email',
  '/v1/documents/send-invoice-by-email',
  { mutating: true, required: ['documentId', 'recipients'] },
);

export const getInvoicePdf: Tool = {
  name: 'get_invoice_pdf',
  description: descriptions.get_invoice_pdf,
  inputSchema: inputSchemaFor('/v1/documents/get-invoice-pdf', ['documentId']),
  run: async args => {
    const body = await callDoklado('/v1/documents/get-invoice-pdf', args);
    const base64Pdf = body.data?.data;

    if (!base64Pdf) {
      throw new Error(
        `No PDF in response: ${JSON.stringify(body).slice(0, 300)}`,
      );
    }

    return saveToDownloads(
      `doklado-${args.documentId}.pdf`,
      Buffer.from(base64Pdf, 'base64'),
    );
  },
};
