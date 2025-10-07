import type {ParsedLockFile} from '../types.js';

export async function parseBunBinary(_input: string): Promise<ParsedLockFile> {
  throw new Error('Bun binary parser not implemented yet');
}
