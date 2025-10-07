import type {ParsedLockFile} from '../types.js';

export async function parsePnpm(_input: string): Promise<ParsedLockFile> {
  throw new Error('pnpm parser not implemented yet');
}
