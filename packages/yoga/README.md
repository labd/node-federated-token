# Federated Token - Yoga Plugin

[![npm](https://img.shields.io/npm/v/@labdigital/federated-token.svg)](https://www.npmjs.com/package/@labdigital/federated-token)

This packages provides a GraphQL Yoga plugin so that for Yoga can be used as a
federated service.

## Usage

- `useFederatedToken()` - The plugin for federated services that reads
  the token passed in the `x-access-token` header and stores it on the context
  as `federatedToken`.

When a federated services creates a new token (when non exist) it can also
return a refresh token in the `x-refresh-token` header. The gateway will then
encrypt all refresh tokens and encrypt them before passing them to the client
as `x-refresh-token` header.
