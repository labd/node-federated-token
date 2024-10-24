# Federated Token - Apollo Plugin

[![npm](https://img.shields.io/npm/v/@labdigital/federated-token.svg)](https://www.npmjs.com/package/@labdigital/federated-token)

This package provides support for both Apollo Server (including Gateway). It
processes the token and forwards it to downstream services and also reads
new/updated tokens from downstream services.

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
