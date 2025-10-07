import type {
  ParsedLockFile,
  ParsedDependency,
  PackageJsonLike
} from '../types.js';
import {createYamlPairReader} from '../line-reader.js';

export async function parseYarn(
  input: string,
  packageJson?: PackageJsonLike
): Promise<ParsedLockFile> {
  const packageMap: Record<string, ParsedDependency> = {};
  const pairReader = createYamlPairReader(input);
  for (const pair of pairReader) {
    if (pair.path.length == 0 && !pair.value && pair.key.includes('@npm:')) {
      const pkgKeys = pair.key.split(', ');
      let pkg: ParsedDependency | undefined;
      for (const pkgKey of pkgKeys) {
        if (packageMap[pkgKey]) {
          pkg = packageMap[pkgKey];
          break;
        }
      }
      if (!pkg) {
        pkg = {
          name: '',
          version: '',
          dependencies: [],
          devDependencies: [],
          optionalDependencies: [],
          peerDependencies: []
        };
      }
      packageMap[pair.key] = pkg;
      for (const pkgKey of pkgKeys) {
        if (!pkg.name) {
          const separatorIndex = pkgKey.indexOf('@', 1);
          const name = pkgKey.slice(0, separatorIndex);
          pkg.name = name;
        }
        packageMap[pkgKey] = pkg;
      }
    } else if (pair.path.length === 1 && pair.key === 'version' && pair.value) {
      const [pkgKey] = pair.path;
      const pkg = packageMap[pkgKey];
      if (pkg) {
        pkg.version = pair.value;
      }
    } else if (
      pair.path.length === 2 &&
      pair.value &&
      (pair.path[1] === 'dependencies' ||
        pair.path[1] === 'optionalDependencies' ||
        pair.path[1] === 'devDependencies' ||
        pair.path[1] === 'peerDependencies')
    ) {
      const [pkgKey, depType] = pair.path;
      const depName = pair.key;
      const depSemver = pair.value;
      const pkg = packageMap[pkgKey];
      const depPkgKey = `${depName}@${depSemver}`;
      let depPkg = packageMap[depPkgKey];
      if (!depPkg) {
        depPkg = {
          name: depName,
          version: '',
          dependencies: [],
          devDependencies: [],
          optionalDependencies: [],
          peerDependencies: []
        };
        packageMap[depPkgKey] = depPkg;
      }
      if (pkg) {
        pkg[depType].push(depPkg);
      }
    }
  }

  const root: ParsedDependency = {
    name: 'root',
    version: '',
    dependencies: [],
    devDependencies: [],
    optionalDependencies: [],
    peerDependencies: []
  };

  if (packageJson) {
    if (packageJson.dependencies) {
      processRootDependencies(
        packageJson.dependencies,
        root.dependencies,
        packageMap
      );
    }
    if (packageJson.devDependencies) {
      processRootDependencies(
        packageJson.devDependencies,
        root.devDependencies,
        packageMap
      );
    }
    if (packageJson.optionalDependencies) {
      processRootDependencies(
        packageJson.optionalDependencies,
        root.optionalDependencies,
        packageMap
      );
    }
    if (packageJson.peerDependencies) {
      processRootDependencies(
        packageJson.peerDependencies,
        root.peerDependencies,
        packageMap
      );
    }
  }

  return {
    type: 'yarn',
    packages: Object.values(packageMap),
    root
  };
}

function processRootDependencies(
  deps: Record<string, string>,
  destination: ParsedDependency[],
  packageMap: Record<string, ParsedDependency>
): void {
  for (const [depName, semver] of Object.entries(deps)) {
    const mapKey = `${depName}@npm:${semver}`;
    const existing = packageMap[mapKey];
    if (existing) {
      destination.push(existing);
    }
  }
}
