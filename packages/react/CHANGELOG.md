# @labdigital/federated-token-react

## 1.0.4

### Patch Changes

- ae838c2: throw exception on server error when refreshing token

## 1.0.3

### Patch Changes

- 9c08247: throw exception on server error when refreshing token

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

- 240b33f: Expose refreshToken() via `useAuth()`
- 74df0d0: Initial version

## 1.0.0-beta.2

### Patch Changes

- 240b33f: Expose refreshToken() via `useAuth()`

## 1.0.0-beta.0

### Major Changes

- d175ba0: Refactor the package to allow for better support of both server-side and
  client-side usage of the cookies. This includes distinquishing cookie names for
  authenticated users versus guest users. Note that this is potentially a breaking
  change for existing users.

  Please refer to the README.md for more information on how to upgrade your
  existing implementation.

### Patch Changes

- 74df0d0: Initial version
