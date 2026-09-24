# @labdigital/federated-token-express-adapter

## 3.1.1

### Patch Changes

- 25b2675: Tell an unverifiable token apart from an expired one, and end the session for it.
  
  `createError` reported every failed claim as `TokenExpiredError`, so a wrong
  `iss` or `aud` reached the client as `UNAUTHENTICATED`. Clients answer that with
  a refresh, which can never succeed: the refresh token carries the same claims.
  Only `JWTExpired` is an expiry now. Any other claim failure is
  `TokenInvalidError`, which `GatewayAuthPlugin` reports as `INVALID_TOKEN`.
  
  `GatewayAuthPlugin` now deletes the access, refresh and data cookies together on
  an invalid token. It deleted only the access cookie, which left
  `userRefreshTokenExists` behind and kept the client retrying.
  
  Two cookie fixes that blocked deletion:
  
  - `userRefreshTokenExists` and `guestRefreshTokenExists` are set with an
    explicit `Path`. Without one the browser derived the path from the refresh
    route, while the deletion used `/`, so the flag could never be removed.
  - `deleteRefreshToken` scopes the deletion with `getPublicDomain`, which is how
    `setRefreshToken` wrote it. It used `getPrivateDomain`.
  
  `INVALID_TOKEN` now declares `http.statusCode: 401` instead of `400`, which
  matches the status the plugin already set on the response.
  
  **Breaking for anyone who branches on `TokenExpiredError`:** a wrong issuer or
  audience now raises `TokenInvalidError`.
- Updated dependencies [25b2675]
  - @labdigital/federated-token@3.1.1

## 3.1.0

### Patch Changes

- Updated dependencies [649b7a1]
  - @labdigital/federated-token@3.1.0

## 3.0.0

### Major Changes

- 416b300: Require Node 22 or newer. Node 20 is no longer supported or tested.

### Minor Changes

- 9d255a9: Mark `express` as a peer dependency. Its types are part of this adapter's public API, so consumers need to have it installed.

### Patch Changes

- 9d255a9: Build the packages with `tsdown` instead of `tsup`, and validate the published output with `publint` on every build.
  
  The documented entry points are unchanged, but `dist/` now contains additional shared chunks next to them. Deep imports into `dist/` were never supported and may break.
- 416b300: Move `cookie` to a dev dependency. It was declared as a runtime dependency but is only used for a type in the tests, so it no longer gets installed for consumers.
- 9d255a9: Declare `"sideEffects": false` so bundlers can tree-shake unused exports, and use the full git URL form for `repository.url`.
- Updated dependencies [9d255a9]
- Updated dependencies [416b300]
- Updated dependencies [43419ba]
- Updated dependencies [9d255a9]
- Updated dependencies [9d255a9]
  - @labdigital/federated-token@3.0.0

## 2.2.0

### Minor Changes

- 3ec97c6: Add support for cookie path and refresh token path function

### Patch Changes

- 05c0a85: Updated vitest and vitest/coverage-v8 versions
- Updated dependencies [4a10d60]
- Updated dependencies [05c0a85]
- Updated dependencies [9d37b46]
- Updated dependencies [3ec97c6]
  - @labdigital/federated-token@2.2.0

## 2.2.0-beta.0

### Minor Changes

- 3ec97c6: Add support for cookie path and refresh token path function

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

- fdde268: Remove the deprecated `CookieTokenSource` from `@labdigital/federated-token`, this is available from `@labdigital/federated-token-express-adapter`
- abf409b: Switch to ESM only builds

### Minor Changes

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

- fdde268: Remove the deprecated `CookieTokenSource` from `@labdigital/federated-token`, this is available from `@labdigital/federated-token-express-adapter`
- abf409b: Switch to ESM only builds

### Minor Changes

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

### Minor Changes

- 134df7c: Add ability to support multiple http frameworks and implement fastify

### Patch Changes

- cdbc926: Properly export HeaderTokenSource from package
- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0

## 1.6.0-beta.4

### Patch Changes

- cdbc926: Properly export HeaderTokenSource from package

## 1.6.0-beta.3

### Minor Changes

- 134df7c: Add ability to support multiple http frameworks and implement fastify

### Patch Changes

- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0-beta.3
