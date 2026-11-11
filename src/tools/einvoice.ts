import {
  acknowledgeReceived,
  getReceived,
  getSendStatus,
  listReceived,
  lookupParticipant,
  sendEinvoice,
} from '../api/sapi.ts';
import type {
  EinvoiceToSend,
  InputSchema,
  ReceivedListQuery,
  Tool,
} from '../types/index.ts';
import { saveToDownloads } from '../utils/downloads.ts';
import { descriptions } from './descriptions.ts';

function objectSchema(
  properties: Record<string, object>,
  required: string[] = [],
): InputSchema {
  return { type: 'object', properties, required };
}

const documentIdSchema = objectSchema({ documentId: { type: 'string' } }, [
  'documentId',
]);

export const einvoiceLookup: Tool = {
  name: 'einvoice_lookup',
  description: descriptions.einvoice_lookup,
  inputSchema: objectSchema(
    {
      dic: {
        type: 'string',
        description: 'DIČ, e.g. 2120000000 or SK2120000000',
      },
    },
    ['dic'],
  ),
  run: args => lookupParticipant(String(args.dic)),
};

export const sendEinvoiceTool: Tool = {
  name: 'send_einvoice',
  description: descriptions.send_einvoice,
  inputSchema: objectSchema(
    {
      xml: { type: 'string', description: 'UBL 2.1 XML, Peppol BIS 3.0' },
      receiverDic: { type: 'string', description: 'Customer DIČ' },
      documentId: {
        type: 'string',
        description: 'Invoice number, e.g. FA-2026001',
      },
    },
    ['xml', 'receiverDic', 'documentId'],
  ),
  run: args => sendEinvoice(args as EinvoiceToSend),
};

export const einvoiceSendStatus: Tool = {
  name: 'einvoice_send_status',
  description: descriptions.einvoice_send_status,
  inputSchema: objectSchema({ providerDocumentId: { type: 'string' } }, [
    'providerDocumentId',
  ]),
  run: args => getSendStatus(String(args.providerDocumentId)),
};

export const einvoiceListReceived: Tool = {
  name: 'einvoice_list_received',
  description: descriptions.einvoice_list_received,
  inputSchema: objectSchema({
    status: { type: 'string', enum: ['RECEIVED', 'ACKNOWLEDGED'] },
    limit: { type: 'integer', minimum: 1, maximum: 100 },
    pageToken: { type: 'string' },
  }),
  run: args => listReceived(args as ReceivedListQuery),
};

export const einvoiceGetReceived: Tool = {
  name: 'einvoice_get_received',
  description: descriptions.einvoice_get_received,
  inputSchema: documentIdSchema,
  run: async args => {
    const documentId = String(args.documentId);
    const received = await getReceived(documentId);

    if (!received.payload) {
      throw new Error(
        `No XML in response: ${JSON.stringify(received).slice(0, 300)}`,
      );
    }

    return {
      file: saveToDownloads(`einvoice-${documentId}.xml`, received.payload),
      metadata: received.metadata,
    };
  },
};

export const einvoiceAcknowledge: Tool = {
  name: 'einvoice_acknowledge',
  description: descriptions.einvoice_acknowledge,
  inputSchema: documentIdSchema,
  run: args => acknowledgeReceived(String(args.documentId)),
};
