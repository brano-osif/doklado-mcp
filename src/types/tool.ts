export type InputSchema = {
  type: 'object';
  [key: string]: unknown;
};

export type ToolArgs = Record<string, unknown>;

export type Tool = {
  name: string;
  description: string;
  inputSchema: InputSchema;
  run: (args: ToolArgs) => Promise<unknown>;
};
