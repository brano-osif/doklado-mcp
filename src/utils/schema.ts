import { readFileSync } from 'node:fs';
import type { InputSchema } from '../types/index.ts';

const specUrl = new URL('../../openapi.json', import.meta.url);
const spec = JSON.parse(readFileSync(specUrl, 'utf8'));

function schemaByRef(ref: string) {
  const name = ref.split('/').pop()!;
  return spec.components.schemas[name];
}

function inlineRefs(node: any, seen = new Set<string>()): any {
  if (Array.isArray(node)) return node.map(item => inlineRefs(item, seen));
  if (!node || typeof node !== 'object') return node;

  if (node.$ref) {
    if (seen.has(node.$ref)) return {};
    return inlineRefs(schemaByRef(node.$ref), new Set(seen).add(node.$ref));
  }

  const entries = Object.entries(node)
    .filter(([key]) => key !== 'continuationToken')
    .map(([key, value]) => [key, inlineRefs(value, seen)]);

  return Object.fromEntries(entries);
}

export function inputSchemaFor(
  path: string,
  required: string[] = [],
): InputSchema {
  const operation = spec.paths[path].post;
  const requestBody = inlineRefs(
    operation.requestBody.content['application/json'].schema,
  );
  const data = requestBody.properties.data;
  const { organizationId, ...properties } = data.properties;

  return {
    ...data,
    type: 'object',
    properties,
    required: [...(data.required ?? []), ...required],
  };
}
