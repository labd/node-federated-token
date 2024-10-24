# @labdigital/federated-token-apollo

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

## 0.13.3

### Patch Changes

- 1f72aa6: Initial release of an Envelop plugin

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
