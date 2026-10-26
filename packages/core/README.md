# Federated Token - Core

[![npm](https://img.shields.io/npm/v/@labdigital/federated-token)](https://www.npmjs.com/package/@labdigital/federated-token)

The core package of [federated-token](../../README.md). It contains the token
model (`FederatedToken` / `PublicFederatedToken`), the `TokenSigner` and
`KeyManager` used to sign and encrypt the JWTs that are sent to clients, and the
framework-agnostic token source building blocks (`CompositeTokenSource`,
`BaseCookieTokenSource`, `BaseHeaderTokenSource`). It is used by the Apollo and
Yoga plugins and the Express and Fastify adapters. The package is ESM only.

## Installation

```sh
pnpm add @labdigital/federated-token graphql
# or
npm install @labdigital/federated-token graphql
```

## Requirements

- Node.js >= 22
- Peer dependency: `graphql` >= 16.6.0

## Usage

### Signing and encrypting tokens

`TokenSigner` signs the data JWT (HS256) and encrypts the access and refresh
JWTs (JWE, `dir` + `A256GCM`). It takes two `KeyManager` instances: one for
signing and one for encryption.

```ts
import { KeyManager, TokenSigner } from "@labdigital/federated-token";

export const createTokenSigner = () =>
	new TokenSigner({
		audience: "my-app",
		issuer: "my-gateway",
		signKeys: new KeyManager([
			{ id: "1", key: Buffer.from(process.env.SIGN_KEY ?? "", "hex") },
		]),
		encryptKeys: new KeyManager([
			{ id: "1", key: Buffer.from(process.env.ENCRYPT_KEY ?? "", "hex") },
		]),
	});
```

The signer is passed to `GatewayAuthPlugin` from
[`@labdigital/federated-token-apollo`](../apollo/README.md), which loads and
creates the tokens for each request.

### Working with the token

In a federated service the plugins store a `FederatedToken` on the context as
`federatedToken`. Resolvers use it to read and set tokens and values:

```ts
import type { FederatedTokenContext } from "@labdigital/federated-token";

const resolvers = {
	Mutation: {
		login: async (_: unknown, args: unknown, ctx: FederatedTokenContext) => {
			const token = ctx.federatedToken;
			if (!token) throw new Error("No federated token");

			token.setAccessToken("commercetools", {
				token: "<access-token>",
				exp: Math.floor(Date.now() / 1000) + 3600,
				sub: "customer-id",
			});
			token.setRefreshToken("commercetools", "<refresh-token>");
			token.setValue("customerName", "Jane");
			token.setIsAuthenticated();
			return true;
		},
		logout: async (_: unknown, args: unknown, ctx: FederatedTokenContext) => {
			ctx.federatedToken?.clear();
			return true;
		},
	},
};
```

### Token sources

A token source reads tokens from a request and writes them to a response.
Framework specific implementations live in
[`@labdigital/federated-token-express-adapter`](../express-adapter/README.md)
and
[`@labdigital/federated-token-fastify-adapter`](../fastify-adapter/README.md).
`CompositeTokenSource` combines several sources: it reads from the first
source that returns a token and writes to all of them.

```ts
import { CompositeTokenSource } from "@labdigital/federated-token";
import {
	CookieTokenSource,
	HeaderTokenSource,
} from "@labdigital/federated-token-express-adapter";

const source = new CompositeTokenSource([
	new CookieTokenSource({
		secure: true,
		sameSite: "lax",
		refreshTokenPath: "/auth/graphql",
	}),
	new HeaderTokenSource(),
]);
```

To support another framework, extend `BaseCookieTokenSource` or
`BaseHeaderTokenSource` from `@labdigital/federated-token/tokensource` and
implement a `CookieAdapter` or `HeaderAdapter`.

## Configuration

`TokenSigner` options:

| Option        | Type                                     | Description                                                  |
| ------------- | ---------------------------------------- | ------------------------------------------------------------ |
| `signKeys`    | `KeyManagerInterface`                    | Keys to sign and verify the data JWT (HS256).                |
| `encryptKeys` | `KeyManagerInterface`                    | Keys to encrypt and decrypt the access and refresh JWTs. Must be 256-bit keys (`A256GCM`). |
| `audience`    | `string \| string[]`                     | JWT audience. Required.                                      |
| `issuer`      | `string`                                 | JWT issuer. Required.                                        |
| `getSubject`  | `(token: PublicFederatedToken) => string` | Optional. Sets the `sub` claim of the data JWT.             |

`KeyManager` takes a list of `{ id, key }` objects, where `key` is a
`Uint8Array` or `KeyObject`. The first key is used to sign and encrypt new
tokens; all keys are used to verify and decrypt by their `kid`, so keys can be
rotated by putting a new key first. Implement `KeyManagerInterface` to load
keys from elsewhere.

Invalid or expired tokens throw `TokenInvalidError` or `TokenExpiredError`.

## Development

From the repository root:

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm tsc
```

## Release

Releases are managed with [changesets](https://github.com/changesets/changesets).
Add a changeset with `pnpm changeset` in your pull request; packages are
published from CI once the release PR is merged.

## License

MIT
