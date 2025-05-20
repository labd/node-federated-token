# @labdigital/federated-token-fastify-adapter

## 2.0.0-beta.0

### Major Changes

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

- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0

## 1.6.0-beta.3

### Minor Changes

- 134df7c: Add ability to support multiple http frameworks and implement fastify

### Patch Changes

- Updated dependencies [134df7c]
  - @labdigital/federated-token@1.6.0-beta.3
