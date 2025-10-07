import type {ParsedLockFile} from '../types.js';

export async function parseBun(_input: string): Promise<ParsedLockFile> {
  throw new Error('Bun parser not implemented yet');
}
