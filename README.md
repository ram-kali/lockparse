# lockparse

> A tiny zero-dependency lockfile parser.

**IMPORTANT**: This library is in early development and the API may change without warning.

## Installation

```bash
npm install lockparse
```

## Usage

```ts
import { parse } from 'lockparse';
import { readFile } from 'node:fs/promises';

const lockfileContent = await readFile('./package-lock.json', 'utf-8');
const packageJson = JSON.parse(await readFile('./package.json', 'utf-8'));
const lockfile = parse(lockfileContent, 'npm', packageJson);

console.log(lockfile.root);
```

## License

MIT
