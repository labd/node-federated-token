# @labdigital/federated-token

## 1.0.4

### Patch Changes

- b31f72e: Only serialize tokens when not empty

## 1.0.2

### Patch Changes

- 8faa026: Fix passing the authenticated state properly

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

- 394eed5: Properly mark token as valid

## 1.0.0-beta.1

### Patch Changes

- 394eed5: Properly mark token as valid

## 1.0.0-beta.0

### Major Changes

- d175ba0: Refactor the package to allow for better support of both server-side and
  client-side usage of the cookies. This includes distinquishing cookie names for
  authenticated users versus guest users. Note that this is potentially a breaking
  change for existing users.

  Please refer to the README.md for more information on how to upgrade your
  existing implementation.

## 0.13.2

### Patch Changes

- 5026ab2: Create CommonJS exports

## 0.13.0

### Minor Changes

- 5d091fd: Split the package in a `core` and a `apollo` specific package. This makes it
  possible to support other gateways/servers in the future
