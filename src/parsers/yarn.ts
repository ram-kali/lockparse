import type {
  ParsedLockFile,
  ParsedDependency,
  PackageJsonLike
} from '../types.js';
import {createLineReader} from '../line-reader.js';

const namePattern = /"(?<key>(?<name>@?[^@]+)@npm:[^"]+)":/;
const dependencyPattern = / {4}"?(?<depName>[^:"]+)"?: "(?<semver>[^"]+)"/;

export async function parseYarn(
  input: string,
  packageJson?: PackageJsonLike
): Promise<ParsedLockFile> {
  const packageMap: Record<string, ParsedDependency> = {};
  const lineReader = createLineReader(input);
  let currentPackage: ParsedDependency | null = null;
  let inDependencies: boolean = false;
  for (const line of lineReader) {
    const nameMatch = line.match(namePattern);
    if (nameMatch && nameMatch.groups) {
      // This is a package name
      const {name, key} = nameMatch.groups;
      inDependencies = false;
      const existing = packageMap[key];
      if (existing) {
        currentPackage = existing;
      } else {
        currentPackage = {
          name,
          version: '',
          dependencies: [],
          devDependencies: [],
          optionalDependencies: [],
          peerDependencies: []
        };
        packageMap[key] = currentPackage;
      }
    } else if (currentPackage) {
      if (inDependencies) {
        const depMatch = line.match(dependencyPattern);
        if (depMatch && depMatch.groups) {
          const {depName, semver} = depMatch.groups;
          const mapKey = `${depName}@${semver}`;
          const existing = packageMap[mapKey];
          if (existing) {
            currentPackage.dependencies.push(existing);
          } else {
            const newDep: ParsedDependency = {
              name: depName,
              version: '',
              dependencies: [],
              devDependencies: [],
              optionalDependencies: [],
              peerDependencies: []
            };
            packageMap[mapKey] = newDep;
            currentPackage.dependencies.push(newDep);
          }
        } else {
          inDependencies = false;
        }
      } else if (line.startsWith('  version: ')) {
        currentPackage.version = line.slice('  version: '.length);
      } else if (line.startsWith('  dependencies:')) {
        inDependencies = true;
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
