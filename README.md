# Bazel Dependency Submission Action

This action parses maven dependencies from a [rules_jvm_external](https://github.com/bazel-contrib/rules_jvm_external) lockfile and submits them to Github's dependency graph.

## Inputs

### `token`

The GitHub token to use to submit with. Defaults to PAT provided by Action runner.

### `maven-lockfile-paths`

The comma separated paths to Maven lockfiles in the repository. Default `./maven_install.json`.

## Example usage

```yaml
uses: jackvincentnz/bazel-dependency-detector@74d1074f1f420bcb245ca7f761ecbf2a826a22d3
with:
  token: ${{ secrets.GITHUB_TOKEN }}
  maven-lockfile-paths: './maven_install.json,./maven_tools_install.json'
```
