# Federated Token - Express Adapter

[![npm](https://img.shields.io/npm/v/@labdigital/federated-token-express-adapter)](https://www.npmjs.com/package/@labdigital/federated-token-express-adapter)

Express implementations of the [federated-token](../../README.md) token
sources. `CookieTokenSource` reads and writes the tokens as cookies (for
browser clients) and `HeaderTokenSource` reads and writes them as HTTP headers
(for server-side clients). Pass them, optionally combined with
`CompositeTokenSource`, to `GatewayAuthPlugin` from
[`@labdigital/federated-token-apollo`](../apollo/README.md). The package is ESM
only.

## Installation

```sh
pnpm add @labdigital/federated-token-express-adapter express cookie-parser
# or
npm install @labdigital/federated-token-express-adapter express cookie-parser
```

## Requirements

- Node.js >= 22
- Peer dependency: `express` >= 4
- `CookieTokenSource` reads `request.cookies`, which Express does not populate
  by itself. Register [`cookie-parser`](https://www.npmjs.com/package/cookie-parser)
  (or another middleware that sets `request.cookies`), otherwise reading the
  cookies throws. It is not a peer dependency; `HeaderTokenSource` works
  without it.

## Usage

```ts
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { CompositeTokenSource } from "@labdigital/federated-token";
import { GatewayAuthPlugin } from "@labdigital/federated-token-apollo";
import {
	CookieTokenSource,
	HeaderTokenSource,
} from "@labdigital/federated-token-express-adapter";
import cookieParser from "cookie-parser";
import express from "express";

const server = new ApolloServer({
	gateway,
	plugins: [
		new GatewayAuthPlugin({
			signer: createTokenSigner(),
			source: new CompositeTokenSource([
				new CookieTokenSource({
					secure: true,
					sameSite: "lax",
					refreshTokenPath: "/auth/graphql",
					publicDomainFn: (request) => "example.com",
				}),
				new HeaderTokenSource(),
			]),
		}),
	],
});
await server.start();

const app = express();
app.use(cookieParser());
app.use(
	"/graphql",
	express.json(),
	expressMiddleware(server, {
		context: async ({ req, res }) => ({ req, res }),
	}),
);
```

`gateway` is your `ApolloGateway` instance and `createTokenSigner()` returns a
`TokenSigner`, see the
[core package](../core/README.md). The context must contain `req` and `res`
so the plugin can read and write the tokens.

## Configuration

`CookieTokenSource` options:

| Option             | Type                                                 | Description                                                                 |
| ------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| `secure`           | `boolean`                                            | Sets the `Secure` cookie flag. Required.                                    |
| `sameSite`         | `"strict" \| "lax" \| "none" \| boolean`             | Sets the `SameSite` cookie attribute. Required.                             |
| `refreshTokenPath` | `string \| (request) => string \| undefined`         | Path of the HTTP-only refresh token cookie. Required.                       |
| `publicDomainFn`   | `(request) => string \| undefined`                   | Domain for the cookies.                                                     |
| `privateDomainFn`  | `(request) => string \| undefined`                   | Exposed via the adapter, not used by the cookie source itself.              |
| `cookiePathFn`     | `(request) => string \| undefined`                   | Path of the non-refresh cookies. Defaults to `/`.                           |
| `cookieNames`      | `Partial<CookieNames>`                               | Override the cookie names (see below).                                      |
| `guestToken`       | `{ expiresIn: number \| "session" }`                 | Expiry in seconds of the guest token and data cookies. Defaults to session. |
| `userToken`        | `{ expiresIn: number \| "session" }`                 | Expiry in seconds of the user token and data cookies. Defaults to session.  |
| `refreshToken`     | `{ expiresIn: number \| "session" }`                 | Expiry in seconds of the refresh token cookies. Defaults to one year.       |

Default cookie names: `userToken`, `guestToken` (HTTP-only access tokens),
`userData`, `guestData` (readable data tokens), `refreshToken` (HTTP-only) and
`userRefreshTokenExists` / `guestRefreshTokenExists`.

`HeaderTokenSource` takes an optional `{ headerNames }` to override the
default `x-access-token`, `x-data-token` and `x-refresh-token` headers. A
`Bearer ` prefix on the access token header is stripped.

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
