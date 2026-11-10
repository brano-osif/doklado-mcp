import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'node:fs';
import { environmentLabel } from './config.ts';
import { tools } from './tools/index.ts';

const packageUrl = new URL('../package.json', import.meta.url);
const { version } = JSON.parse(readFileSync(packageUrl, 'utf8'));

const toolsByName = new Map(tools.map(tool => [tool.name, tool]));

function asText(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return { content: [{ type: 'text' as const, text }] };
}

function asError(message: string) {
  return { ...asText(message), isError: true };
}

const { server } = new McpServer(
  { name: 'doklado-mcp', version },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: tools.map(({ name, description, inputSchema }) => ({
    name,
    description: `${description} (${environmentLabel})`,
    inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
  const tool = toolsByName.get(params.name);
  if (!tool) return asError(`Unknown tool ${params.name}`);

  try {
    return asText(await tool.run(params.arguments ?? {}));
  } catch (error) {
    return asError(error instanceof Error ? error.message : String(error));
  }
});

await server.connect(new StdioServerTransport());
