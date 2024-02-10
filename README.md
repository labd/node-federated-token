# Federated Token

[![npm](https://img.shields.io/npm/v/@labdigital/federated-token.svg)](https://www.npmjs.com/package/@labdigital/federated-token)

This package provides support for using JWT tokens for clients and passing
that information to all federated services. The JWT token includes a JWE token
for sensitive information like the client specific access tokens of third party
systems.

It provides three Apollo specific classes:

- `GatewayAuthPlugin` - An Apollo plugin for the GraphQL gateway that verifies
  the signature of the token passed and decrypts the embedded JWE property. It
  stores the verified and decrypted token on the context as `federatedToken`.

- `FederatedGraphQLDataSource` - An Apollo GraphQL data source used in the
  GraphQL Gateway which passes the `federatedToken` from the context to the
  datasource (federated service) as `x-access-token` HTTP header.

- `FederatedAuthPlugin` - An Apollo plugin for federated services that reads
  the token passed in the `x-access-token` header and stores it on the context
  as `federatedToken`.

When a federated services creates a new token (when non exist) it can also
return a refresh token in the `x-refresh-token` header. The gateway will then
encrypt all refresh tokens and encrypt them before passing them to the client
as `x-refresh-token` header.

# Token sources

Public tokens can be passed via either HTTP headers or cookies. For browser
clients cookies are the preferred way since these are easiest to store safely in
the browser using a combination of HTTP_ONLY cookies and non-HTTP_ONLY cookies.

## Cookie Token Source

This token source is used for browser clients to safely store the token. It is
implemented via 4 cookies:

- `accessToken` - The JWT token
- `tokenFingerprint` - A random string that is used to protect the AccessToken
  cookie from CSRF attacks. It is stored as HTTP_ONLY cookie.
- `refreshToken` - The refresh token, if any. It is stored as HTTP_ONLY cookie.
- `refreshTokenExists` - A boolean value that indicates if a refresh token
  exists for the user. It is used to determine if the user is new or not.

Note that this expects the "cookie-parser" express middleware to be used.
