import { PackageCache } from '@github/dependency-submission-toolkit'
import { describe, expect, test } from 'vitest'

import {
  createBuildTarget,
  Lockfile,
  parseArtifacts,
  processLockfile,
  toPackageURL
} from './bazel-detector.js'
import { PackageURL } from 'packageurl-js'

describe('toPackageURL', () => {
  test('parses group, name and version', () => {
    expect(toPackageURL('ch.qos.logback:logback-core', '1.1.11')).toEqual(new PackageURL('maven', 'ch.qos.logback', 'logback-core', '1.1.11', null, null));
  })

  test('throws error if more than 3 parts', () => {
    expect(() => {
      toPackageURL('com.graphql-java-generator:graphql-java-client-dependencies:pom:something', '1.18.9')
    }).toThrow()
  })
})

describe('parseArtifacts', () => {
  test('parse single artifact', () => {
    const lockfile: Lockfile = { 
      artifacts: { 'org.apache.xmlgraphics:batik-anim': { version: '1.9.1' } },
      version: '2'
    };
    const cache = new PackageCache()
    const pkgs = parseArtifacts(cache, lockfile)

    expect(pkgs).toHaveLength(1)
    expect(pkgs[0]?.packageID()).toEqual('pkg:maven/org.apache.xmlgraphics/batik-anim@1.9.1')
    expect(cache.countPackages()).toEqual(1)
  })

  test('parse multiple dependencies, single depth', () => {
    const lockfile: Lockfile = { 
      artifacts: { 
        'org.apache.xmlgraphics:batik-anim': { version: '1.9.1' },
        'ch.qos.logback:logback-core': { version: '1.1.11' }
      },
      version: '2'
    };
    const cache = new PackageCache()
    const pkgs = parseArtifacts(cache, lockfile)

    expect(pkgs).toHaveLength(2)
    expect(pkgs[0]?.packageID()).toEqual('pkg:maven/org.apache.xmlgraphics/batik-anim@1.9.1')
    expect(pkgs[1]?.packageID()).toEqual('pkg:maven/ch.qos.logback/logback-core@1.1.11')
    expect(cache.countPackages()).toEqual(2)
  })

  test('parse invalid lockfile version', () => {
    const lockfile: Lockfile = { 
      artifacts: { 'org.apache.xmlgraphics:batik-anim': { version: '1.9.1' } },
      version: '1'
    };
    const cache = new PackageCache()
    
    expect(() => parseArtifacts(cache, lockfile)).toThrow();
  })
})

describe('createBuildTarget', () => {
  test('parse lockfile', () => {
    const path = 'maven_install.json'
    const lockfile: Lockfile = { 
      artifacts: { 
        'org.apache.xmlgraphics:batik-anim': { version: '1.9.1' },
        'ch.qos.logback:logback-core': { version: '1.1.11' }
      },
      version: '2'
    };

    const buildTarget = createBuildTarget(path, lockfile)
    expect(buildTarget.name).toEqual(path)
    expect(buildTarget.directDependencies()).toHaveLength(2)
  })
})

describe('processLockFile', () => {
  test('dependency count', async () => {
    const path = 'maven_install.json'

    const buildTarget = await processLockfile(path)
    
    expect(buildTarget.name).toEqual(path)
    expect(buildTarget.directDependencies()).toHaveLength(295)
  })
})