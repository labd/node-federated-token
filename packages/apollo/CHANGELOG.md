# @labdigital/federated-token-apollo

## 2.0.0-beta.2

### Patch Changes

- ad2c4ec: Improve masking of tokens when logging errors

## 2.0.0-beta.1

### Minor Changes

- 9c25b37: Allow passing a logger instance to GatewayAuthPlugin

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

- 48871e9: Fix a typing issue when using fastify instead of express
- Updated dependencies [7ee79e7]
  - @labdigital/federated-token@1.6.1

## 1.6.0

### Minor Changes

- 3cc7b1e: Fix version naming
- bd7b6b6: fix: return GraphQLError when refresh token is invalid
- 8b81410: Properly return GraphQLError when token is expired/invalid
- 134df7c: Add ability to support multiple http frameworks and implement fastify

### Patch Changes

- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0

## 1.6.0-beta.3

### Minor Changes

- 134df7c: Add ability to support multiple http frameworks and implement fastify

### Patch Changes

- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0-beta.3

## 1.6.0-beta.2

### Minor Changes

- bd7b6b6: fix: return GraphQLError when refresh token is invalid

## 1.6.0-beta.1

### Minor Changes

- 3cc7b1e: Fix version naming

## 1.6.0-1.6.0-beta.0.0

### Minor Changes

- 8b81410: Properly return GraphQLError when token is expired/invalid

## 1.4.3

### Patch Changes

- 1909c30: Added separate load and verify for data token
- Updated dependencies [1909c30]
  - @labdigital/federated-token@1.4.3

## 1.4.2

### Patch Changes

- b5ca950: Removed check for existing refreshToken when setting accessToken

## 1.4.1

### Patch Changes

- 4e538e9: resolve issue with release process and formatting
- Updated dependencies [4e538e9]
  - @labdigital/federated-token@1.4.1

## 1.4.0

### Minor Changes

- b3b2cd6: Handle token processing in `requestDidStart()` hook so other plugins can use the result

### Patch Changes

- df48774: Switch to biomejs for linting and formatting
- Updated dependencies [df48774]
- Updated dependencies [c592ac0]
  - @labdigital/federated-token@1.4.0

## 1.0.4

### Patch Changes

- d6b8b5e: minor optimalization when setting tokens
- Updated dependencies [b31f72e]
  - @labdigital/federated-token@1.0.4

## 1.0.2

### Patch Changes

- Updated dependencies [8faa026]
  - @labdigital/federated-token@1.0.2

## 1.0.0

### Major Changes

- d175ba0: Refactor the package to allow for better support of both server-side and
  client-side usage of the cookies. This includes distinquishing cookie names for
  authenticated users versus guest users. Note that this is potentially a breaking
  change for existing users.

  Please refer to the README.md for more information on how to upgrade your
  existing implementation.

- 78170c3: First 1.0.0 release

### Patch Changes

- Updated dependencies [d175ba0]
- Updated dependencies [394eed5]
- Updated dependencies [78170c3]
  - @labdigital/federated-token@1.0.0

## 1.0.0-beta.1

### Patch Changes

- Updated dependencies [394eed5]
  - @labdigital/federated-token@1.0.0-beta.1

## 1.0.0-beta.0

### Major Changes

- d175ba0: Refactor the package to allow for better support of both server-side and
  client-side usage of the cookies. This includes distinquishing cookie names for
  authenticated users versus guest users. Note that this is potentially a breaking
  change for existing users.

  Please refer to the README.md for more information on how to upgrade your
  existing implementation.

### Patch Changes

- Updated dependencies [d175ba0]
  - @labdigital/federated-token@1.0.0-beta.0

## 0.13.2

### Patch Changes

- 5026ab2: Create CommonJS exports
- Updated dependencies [5026ab2]
  - @labdigital/federated-token@0.13.2

## 0.13.1

### Patch Changes

- 8cb1d63: Export `PublicFederatedTokenContext`

## 0.13.0

### Minor Changes

- 5d091fd: Split the package in a `core` and a `apollo` specific package. This makes it
  possible to support other gateways/servers in the future

### Patch Changes

- Updated dependencies [5d091fd]
  - @labdigital/federated-token@0.13.0
