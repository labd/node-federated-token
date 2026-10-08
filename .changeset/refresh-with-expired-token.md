---
"@labdigital/federated-token-apollo": major
---

`GatewayAuthPlugin` no longer rejects a request with 401 when its access or data token has expired but it carries a valid refresh token. Instead, the expired token is cleared and the request continues without it, so a refresh succeeds on its first attempt instead of failing until it is retried without the access token.

- Send the refresh token with refresh requests only: a refresh cookie scoped to a dedicated endpoint via `refreshTokenPath`, or for header clients, `x-refresh-token` on the refresh mutation alone. Any other request that carries it runs as a guest instead of getting a 401, and a resolver that mints an anonymous session replaces the user's refresh token.
- An expired access token together with an invalid data token now returns `INVALID_TOKEN` and clears the whole session, including a valid refresh token. Previously it returned the expired 401.
- An expired access token together with an invalid refresh token still returns the expired 401, but now also clears the refresh cookie.
