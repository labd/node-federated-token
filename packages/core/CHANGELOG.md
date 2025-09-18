# @labdigital/federated-token

## 2.2.0-beta.0

### Minor Changes

- 3ec97c6: Add support for cookie path and refresh token path function

## 2.1.0

### Minor Changes

- 8f0d3ee: Update dependencies

## 2.0.0

### Major Changes

- fdde268: Remove the deprecated `CookieTokenSource` from `@labdigital/federated-token`, this is available from `@labdigital/federated-token-express-adapter`
- d134a6b: Remove `HeaderTokenSource` (moved to `@labdigital/federated-token-express-adapter`)
- 87334e6: Move JWE encryption from `A128CBC-HS256` to `A256GCM`
- abf409b: Switch to ESM only builds

### Minor Changes

- de5c70a: Set the expire time on the protected header of the JWT token, in order to read
  it without decryption.
- 3d5baf8: Add ability to set custom expires time for the various cookies. For example:

  ```ts
  const cookieTokenSource = new CookieTokenSource({
    secure: true,
    sameSite: "strict",
    refreshTokenPath: "/refresh",
    userToken: {
      expiresIn: 30 * 24 * 60 * 60, // 30 days
    },
  });
  ```

  This will set the user token cookie to expire in 30 days. The default value is when
  the browser is closed.

## 2.0.0-beta.0

### Major Changes

- fdde268: Remove the deprecated `CookieTokenSource` from `@labdigital/federated-token`, this is available from `@labdigital/federated-token-express-adapter`
- d134a6b: Remove `HeaderTokenSource` (moved to `@labdigital/federated-token-express-adapter`)
- 87334e6: Move JWE encryption from `A128CBC-HS256` to `A256GCM`
- abf409b: Switch to ESM only builds

### Minor Changes

- de5c70a: Set the expire time on the protected header of the JWT token, in order to read
  it without decryption.
- 3d5baf8: Add ability to set custom expires time for the various cookies. For example:

  ```ts
  const cookieTokenSource = new CookieTokenSource({
    secure: true,
    sameSite: "strict",
    refreshTokenPath: "/refresh",
    userToken: {
      expiresIn: 30 * 24 * 60 * 60, // 30 days
    },
  });
  ```

  This will set the user token cookie to expire in 30 days. The default value is when
  the browser is closed.

## 1.7.0

### Minor Changes

- 47f6a6a: Replace lodash.isEqual with node:util `isDeepStrictEqual`

## 1.6.1

### Patch Changes

- 7ee79e7: Explictly set the cookie path to fix issue with fastify, which otherwise uses the wrong default path

## 1.6.0

### Minor Changes

- 134df7c: Add ability to support multiple http frameworks and implement fastify

## 1.6.0-beta.3

### Minor Changes

- 134df7c: Add ability to support multiple http frameworks and implement fastify

## 1.4.3

### Patch Changes

- 1909c30: Added separate load and verify for data token

## 1.4.1

### Patch Changes

- 4e538e9: resolve issue with release process and formatting

## 1.4.0

### Minor Changes

- c592ac0: Modify `Token.isValid()` on availability of tokens instead of manually tracking it

### Patch Changes

- df48774: Switch to biomejs for linting and formatting

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
