import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const DOWNLOADS_DIR = join(homedir(), 'Downloads');

export function saveToDownloads(fileName: string, content: string | Buffer) {
  const safeFileName = fileName.replace(/[^\w.-]/g, '_');
  const path = join(DOWNLOADS_DIR, safeFileName);

  mkdirSync(DOWNLOADS_DIR, { recursive: true });
  writeFileSync(path, content);

  return path;
}
