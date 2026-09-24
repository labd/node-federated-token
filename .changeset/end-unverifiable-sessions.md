---
"@labdigital/federated-token": minor
"@labdigital/federated-token-apollo": minor
---

Tell an unverifiable token apart from an expired one, and end the session for it.

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
