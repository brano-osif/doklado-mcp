import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const server = new URL('./src/index.ts', import.meta.url).pathname;

const connect = async (env: Record<string, string>) => {
  const c = new Client({ name: 'test', version: '1' });
  await c.connect(
    new StdioClientTransport({
      command: 'node',
      args: [server],
      env: { ...process.env, ...env } as Record<string, string>,
    }),
  );
  return c;
};
const call = async (
  c: Client,
  name: string,
  args: Record<string, unknown> = {},
) => {
  const r = await c.callTool({ name, arguments: args });
  return {
    error: !!r.isError,
    text: (r.content as { text: string }[])[0].text,
  };
};

assert.notEqual(
  spawnSync('node', [server], { env: { PATH: process.env.PATH } }).status,
  0,
  'starts without env',
);

const c = await connect({});
const names = (await c.listTools()).tools.map(t => t.name);
assert.ok(!names.includes('issue_invoice'), 'issue_invoice hidden by default');
assert.equal(
  names.filter(n => !n.startsWith('einvoice_') && n !== 'send_einvoice').length,
  5,
);

const list = await call(c, 'list_documents', {
  resourceSubType: ['issued_invoice'],
  orderBy: 'creation_date',
});
assert.ok(!list.error, list.text);
const { documents, searchAfter } = JSON.parse(list.text);
assert.ok(
  Array.isArray(documents) && documents.length > 0,
  'sandbox has issued invoices',
);
assert.ok(
  Array.isArray(searchAfter),
  'non-empty page returns a searchAfter token',
);

const next = await call(c, 'list_documents', {
  resourceSubType: ['issued_invoice'],
  orderBy: 'creation_date',
  searchAfter,
});
assert.deepEqual(
  JSON.parse(next.text),
  { documents: [], searchAfter: null },
  'page after the last one is empty',
);

const empty = await call(c, 'list_documents', { resourceTypes: ['receipt'] });
assert.deepEqual(
  JSON.parse(empty.text),
  { documents: [], searchAfter: null },
  'APP_NO_MORE_DATA is an empty page',
);

if (documents[0]) {
  const doc = await call(c, 'get_document', {
    documentId: documents[0].documentId,
  });
  assert.ok(
    !doc.error && JSON.parse(doc.text).documentId === documents[0].documentId,
  );
  const pdf = await call(c, 'get_invoice_pdf', {
    documentId: documents[0].documentId,
  });
  assert.ok(!pdf.error && pdf.text.endsWith('.pdf'), pdf.text);
}

assert.ok((await call(c, 'get_document', { documentId: 'nope' })).error);
assert.ok((await call(c, 'nope')).error);
await c.close();

const bad = await connect({ DOKLADO_API_KEY: 'nope' });
const denied = await call(bad, 'get_document', { documentId: 'x' });
assert.ok(denied.error && JSON.parse(denied.text).http === 401, denied.text);
await bad.close();

const withIssue = await connect({ DOKLADO_ISSUE: 'true' });
assert.ok(
  (await withIssue.listTools()).tools.some(t => t.name === 'issue_invoice'),
);
await withIssue.close();

if (process.env.DOKLADO_SAPI_CLIENT_ID) {
  const s = await connect({});
  const lookup = await call(s, 'einvoice_lookup', {
    dic: process.env.DOKLADO_DIC,
  });
  assert.ok(
    !lookup.error && JSON.parse(lookup.text).found === true,
    `own DIČ is a Peppol participant: ${lookup.text}`,
  );
  const received = await call(s, 'einvoice_list_received', { limit: 5 });
  assert.ok(
    !received.error && Array.isArray(JSON.parse(received.text).documents),
    received.text,
  );
  await s.close();

  const badSapi = await connect({ DOKLADO_SAPI_SECRET: 'nope' });
  const rejected = await call(badSapi, 'einvoice_lookup', {
    dic: process.env.DOKLADO_DIC,
  });
  assert.ok(rejected.error && rejected.text.includes('"http"'), rejected.text);
  await badSapi.close();
  console.log('sapi ok');
}

console.log(
  `ok (${documents.length} issued invoices, searchAfter ${JSON.stringify(searchAfter)})`,
);
