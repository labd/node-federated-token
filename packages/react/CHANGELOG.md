# @labdigital/federated-token-react

## 1.5.1

## 1.5.0

### Minor Changes

- 7cdf39c: Replace jsonwebtoken with jose as jsonwebtoken relies on built-in node modules.

## 1.4.1

### Patch Changes

- 4e538e9: resolve issue with release process and formatting

## 1.4.0

### Patch Changes

- df48774: Switch to biomejs for linting and formatting

## 1.3.0

### Minor Changes

- e04dd55: Support passing custom handlers for logout and refresh actions

## 1.2.1

### Patch Changes

- 353d4aa: Fix error when refreshing access token

## 1.1.0

### Minor Changes

- 40138e6: Split GraphQL endpoint for refresh vs logout

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
