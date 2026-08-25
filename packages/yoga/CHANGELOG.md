# @labdigital/federated-token-yoga

## 3.0.0

### Major Changes

- 416b300: Require Node 22 or newer. Node 20 is no longer supported or tested.

### Patch Changes

- 9d255a9: Build the packages with `tsdown` instead of `tsup`, and validate the published output with `publint` on every build.
  
  The documented entry points are unchanged, but `dist/` now contains additional shared chunks next to them. Deep imports into `dist/` were never supported and may break.
- 9d255a9: Declare `"sideEffects": false` so bundlers can tree-shake unused exports, and use the full git URL form for `repository.url`.
- 9140455: Mark graphql-yoga as peer-dependency
- Updated dependencies [9d255a9]
- Updated dependencies [416b300]
- Updated dependencies [43419ba]
- Updated dependencies [9d255a9]
- Updated dependencies [9d255a9]
  - @labdigital/federated-token@3.0.0

## 2.2.0

### Patch Changes

- 05c0a85: Updated vitest and vitest/coverage-v8 versions
- Updated dependencies [4a10d60]
- Updated dependencies [05c0a85]
- Updated dependencies [9d37b46]
- Updated dependencies [3ec97c6]
  - @labdigital/federated-token@2.2.0

## 2.2.0-beta.0

### Patch Changes

- Updated dependencies [3ec97c6]
  - @labdigital/federated-token@2.2.0-beta.0

## 2.1.0

### Minor Changes

- 8f0d3ee: Update dependencies

### Patch Changes

- Updated dependencies [8f0d3ee]
  - @labdigital/federated-token@2.1.0

## 2.0.0

### Major Changes

- abf409b: Switch to ESM only builds

### Patch Changes

- Updated dependencies [fdde268]
- Updated dependencies [d134a6b]
- Updated dependencies [de5c70a]
- Updated dependencies [3d5baf8]
- Updated dependencies [87334e6]
- Updated dependencies [abf409b]
  - @labdigital/federated-token@2.0.0

## 2.0.0-beta.0

### Major Changes

- abf409b: Switch to ESM only builds

### Patch Changes

- Updated dependencies [fdde268]
- Updated dependencies [d134a6b]
- Updated dependencies [de5c70a]
- Updated dependencies [3d5baf8]
- Updated dependencies [87334e6]
- Updated dependencies [abf409b]
  - @labdigital/federated-token@2.0.0-beta.0

## 1.7.0

### Patch Changes

- Updated dependencies [47f6a6a]
  - @labdigital/federated-token@1.7.0

## 1.6.1

### Patch Changes

- Updated dependencies [7ee79e7]
  - @labdigital/federated-token@1.6.1

## 1.6.0

### Patch Changes

- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0

## 1.6.0-beta.3

### Patch Changes

- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0-beta.3

## 1.4.3

### Patch Changes

- 1909c30: Added separate load and verify for data token
- Updated dependencies [1909c30]
  - @labdigital/federated-token@1.4.3

## 1.4.1

### Patch Changes

- 4e538e9: resolve issue with release process and formatting
- Updated dependencies [4e538e9]
  - @labdigital/federated-token@1.4.1

## 1.4.0

### Patch Changes

- df48774: Switch to biomejs for linting and formatting
- Updated dependencies [df48774]
- Updated dependencies [c592ac0]
  - @labdigital/federated-token@1.4.0

## 1.2.0

### Minor Changes

- ad1f72a: Require the FederatedToken to already exist on the context

## 1.0.4

### Patch Changes

- Updated dependencies [b31f72e]
  - @labdigital/federated-token@1.0.4

## 1.0.2

### Patch Changes

- Updated dependencies [8faa026]
  - @labdigital/federated-token@1.0.2

## 1.0.1

### Patch Changes

- 996ea3f: First release of yoga plugin
