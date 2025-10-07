import type {ParsedLockFile, LockFileType, PackageJsonLike} from './types.js';
import {parseNpm} from './parsers/npm.js';
import {parseYarn} from './parsers/yarn.js';
import {parsePnpm} from './parsers/pnpm.js';
import {parseBun} from './parsers/bun.js';
import {parseBunBinary} from './parsers/bunBinary.js';

const typeMap: Record<string, LockFileType> = {
  'package-lock.json': 'npm',
  'yarn.lock': 'yarn',
  'pnpm-lock.yaml': 'pnpm',
  'bun.lockb': 'bun',
  'bun.lock': 'bun-binary',
  npm: 'npm',
  yarn: 'yarn',
  pnpm: 'pnpm',
  bun: 'bun',
  bunb: 'bun-binary'
};

export function parse(
  input: string,
  typeOrFileName: string,
  packageJson?: PackageJsonLike
): Promise<ParsedLockFile> {
  const lockFileType = typeMap[typeOrFileName];

  switch (lockFileType) {
    case 'npm':
      return parseNpm(input);
    case 'yarn':
      return parseYarn(input, packageJson);
    case 'pnpm':
      return parsePnpm(input);
    case 'bun':
      return parseBun(input);
    case 'bun-binary':
      return parseBunBinary(input);
    default:
      throw new Error(`Unsupported lock file type: ${typeOrFileName}`);
  }
}
