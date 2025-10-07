import type {ParsedLockFile, ParsedDependency} from '../types.js';

interface NpmLockFilePeerDependencyMeta {
  optional?: boolean;
}

interface NpmLockFilePackage {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, NpmLockFilePeerDependencyMeta>;
}

interface NpmLockFileLike {
  name: string;
  version: string;
  packages: Record<string, NpmLockFilePackage>;
}

export async function parseNpm(input: string): Promise<ParsedLockFile> {
  let lockFile: NpmLockFileLike;

  try {
    lockFile = JSON.parse(input);
  } catch {
    return Promise.reject(new Error('Invalid JSON format'));
  }

  const rootPackage = lockFile.packages[''];

  if (!rootPackage) {
    throw new Error('Invalid npm lock file: missing root package');
  }

  const {packages, root} = processPackages(lockFile.packages);

  const parsed: ParsedLockFile = {
    type: 'npm',
    packages,
    root
  };

  return parsed;
}

function processPackages(input: Record<string, NpmLockFilePackage>): {
  root: ParsedDependency;
  packages: ParsedDependency[];
} {
  const packageMap: Record<string, ParsedDependency> = {};

  for (const [pkgKey, pkg] of Object.entries(input)) {
    const modulesIndex = pkgKey.lastIndexOf('node_modules/');
    let name = pkg.name;
    if (modulesIndex !== -1) {
      name = pkgKey.slice(modulesIndex + 'node_modules/'.length);
    }
    packageMap[pkgKey] = {
      name,
      version: pkg.version,
      dependencies: [],
      devDependencies: [],
      peerDependencies: [],
      optionalDependencies: []
    };
  }

  const root = packageMap[''];

  for (const [pkgKey, pkg] of Object.entries(input)) {
    const parsedPkg = packageMap[pkgKey];

    if (pkg.dependencies) {
      processDependencyMap(
        pkg.dependencies,
        parsedPkg.dependencies,
        packageMap,
        pkgKey
      );
    }

    if (pkg.devDependencies) {
      processDependencyMap(
        pkg.devDependencies,
        parsedPkg.devDependencies,
        packageMap,
        pkgKey
      );
    }

    if (pkg.peerDependencies) {
      processDependencyMap(
        pkg.peerDependencies,
        parsedPkg.peerDependencies,
        packageMap,
        pkgKey
      );
    }

    if (pkg.optionalDependencies) {
      processDependencyMap(
        pkg.optionalDependencies,
        parsedPkg.optionalDependencies,
        packageMap,
        pkgKey
      );
    }
  }

  return {packages: Object.values(packageMap), root};
}

function processDependencyMap(
  deps: Record<string, string>,
  destination: ParsedDependency[],
  packageMap: Record<string, ParsedDependency>,
  parentKey: string
): void {
  for (const depName of Object.keys(deps)) {
    let currentPath = parentKey ? `${parentKey}/node_modules` : 'node_modules';
    let possiblePackage = packageMap[`${currentPath}/${depName}`];
    while (!possiblePackage) {
      const modulesIndex = currentPath.lastIndexOf('node_modules/');
      if (modulesIndex === -1) {
        break;
      }
      currentPath = currentPath.slice(
        0,
        modulesIndex + 'node_modules/'.length - 1
      );
      possiblePackage = packageMap[`${currentPath}/${depName}`];
    }
    if (possiblePackage) {
      destination.push(possiblePackage);
    }
  }
}
