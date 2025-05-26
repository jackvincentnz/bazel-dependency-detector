# Bazel Dependency Submission Action

This action parses maven dependencies from a rules_jvm_external lockfile and submits them to Github's dependency graph.

## Inputs

### `token`

The github token to use to submit with. Default `${{ github.token }}`.

### `maven-lockfile-paths`

The comma separated paths to maven lockfiles in the repository. Default `./maven_install.json`.

## Example usage

```yaml
uses: jackvincentnz/bazel-dependency-detector@<SHA>
with:
  token: ${{ github.token }}
  maven-lockfile-paths: './maven_install.json,./maven_tools_install.json'
```
