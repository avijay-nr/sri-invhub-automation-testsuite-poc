import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STORE_DIR = join(tmpdir(), 'sri-invhub-automation-testsuite');
const STORE_PATH = join(STORE_DIR, 'last-case-name.txt');

export function saveLastCaseName(caseName: string): void {
  mkdirSync(STORE_DIR, { recursive: true });
  writeFileSync(STORE_PATH, caseName, 'utf8');
}

export function readLastCaseName(): string {
  if (!existsSync(STORE_PATH)) return '';
  return readFileSync(STORE_PATH, 'utf8').trim();
}
