import fs from 'fs/promises';
import * as core from '@actions/core'
import {
  BuildTarget,
  type Package,
  PackageCache,
  Snapshot,
  submitSnapshot
} from '@github/dependency-submission-toolkit'
import { PackageURL } from 'packageurl-js'

export type Lockfile = { 
  artifacts: Artifacts,
  version: string
}

export type Artifacts ={
  [key: string]: Artifact
}

export type Artifact = {
  version: string
}

export function toPackageURL(artifactName: string, version: string): PackageURL {
  const parts = artifactName.split(':')

  if (parts.length === 2) {
    return new PackageURL('maven', parts[0], parts[1]!, version, null, null)
  } else if (parts.length === 3) {
    return new PackageURL('maven', parts[0], parts[1]!, version, { packaging: parts[2]!}, null)
  }

  throw new Error(`expectation violated: artifact '${artifactName}' has unexpected format`)
}

export function parseArtifact(cache: PackageCache, name: string, artifacts: Artifacts): Package {
  const purl = toPackageURL(name, artifacts[name]!.version)

  if (cache.hasPackage(purl)) {
    return cache.package(purl)
  }

  return cache.package(purl)
}

export function parseArtifacts(
  cache: PackageCache,
  lockfile: Lockfile
): Array<Package> {
  if (lockfile.version !== '2' && lockfile.version !== '3') {
    throw new Error(`Unsupported lockfile version: ${lockfile.version}. Expected version 2.`);
  }

  return Object.keys(lockfile.artifacts).map(artifactName => {
    return parseArtifact(cache, artifactName, lockfile.artifacts)
  })
}

export function createBuildTarget(path: string, lockfile: Lockfile): BuildTarget {
  const cache = new PackageCache()
  const packages = parseArtifacts(cache, lockfile)
  const buildTarget = new BuildTarget(path)
  for (const pkg of packages) {
    buildTarget.addBuildDependency(pkg)
  }
  return buildTarget
}

export async function parseLockfile(path: string): Promise<Lockfile> {  
    const data = await fs.readFile(path, { encoding: 'utf8' });
    return JSON.parse(data) as Lockfile;
}

export async function processLockfile(path: string): Promise<BuildTarget> {
  const lockfile = await parseLockfile(path);

  return createBuildTarget(path, lockfile);
}

export async function main() {
  const mavenLockfilePathsInput = core.getInput('maven-lockfile-paths')
  const mavenLockfilePaths = mavenLockfilePathsInput.split(',').map(p => p.trim());

  if (mavenLockfilePaths.length === 0) {
    core.setFailed('No maven lockfile paths provided')
    return;
  }

  const snapshot = new Snapshot({
    name: 'Bazel Dependency Detector',
    url: 'https://github.com/jackvincentnz/bazel-dependency-detector/tree/main',
    version: '0.4.0'
  })

  for (const path of mavenLockfilePaths) {
    const buildTarget = await processLockfile(path)
    snapshot.addManifest(buildTarget)
  }

  submitSnapshot(snapshot)
}
