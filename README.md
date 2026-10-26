# Federated Token

| Package | Version |
| ------- | ------- |
| [`@labdigital/federated-token`](packages/core) | [![npm](https://img.shields.io/npm/v/@labdigital/federated-token)](https://www.npmjs.com/package/@labdigital/federated-token) |
| [`@labdigital/federated-token-apollo`](packages/apollo) | [![npm](https://img.shields.io/npm/v/@labdigital/federated-token-apollo)](https://www.npmjs.com/package/@labdigital/federated-token-apollo) |
| [`@labdigital/federated-token-yoga`](packages/yoga) | [![npm](https://img.shields.io/npm/v/@labdigital/federated-token-yoga)](https://www.npmjs.com/package/@labdigital/federated-token-yoga) |
| [`@labdigital/federated-token-express-adapter`](packages/express-adapter) | [![npm](https://img.shields.io/npm/v/@labdigital/federated-token-express-adapter)](https://www.npmjs.com/package/@labdigital/federated-token-express-adapter) |
| [`@labdigital/federated-token-fastify-adapter`](packages/fastify-adapter) | [![npm](https://img.shields.io/npm/v/@labdigital/federated-token-fastify-adapter)](https://www.npmjs.com/package/@labdigital/federated-token-fastify-adapter) |
| [`@labdigital/federated-token-react`](packages/react) | [![npm](https://img.shields.io/npm/v/@labdigital/federated-token-react)](https://www.npmjs.com/package/@labdigital/federated-token-react) |

This repository contains multiple packages using JWT tokens for clients and
passing that information to all federated services (upstream and downstream).

## Packages
 - `@labdigital/federated-token` - The core package that provides the token
	 handling and token sources.
 - `@labdigital/federated-token-apollo` - A plugin for Apollo Server (and gateway).
 - `@labdigital/federated-token-yoga` - A plugin for GraphQL Yoga.
 - `@labdigital/federated-token-express-adapter` - An Express adapter for the
	 `CookieTokenSource` and `HeaderTokenSource` to be used in an Express application.
 - `@labdigital/federated-token-fastify-adapter` - A Fastify adapter for the
   `CookieTokenSource` and `HeaderTokenSource` to be used in a Fastify application.
 - `@labdigital/federated-token-react` - A React context provider for managing the
	 token state in a React application.


# Upgrading from 0.x to 1.x
The 1.x release is a considerable rewrite of the package to allow better
distinction between authenticated users and guest users. This primarily impacts
the `CookieTokenSource` This allows you to control on your CDN which cookies are
white-listed and which are not.

For ease of implementation and migrating users with existing cookies you need to
make sure that both the refresh-token and the refresh-token-exists cookie names
match the old names.

```ts
const server = new ApolloServer({
	// ...
	plugins: [
		// ...
		new GatewayAuthPlugin({
			signer: createTokenSigner(),
			source: new CompositeTokenSource([
				new CookieTokenSource({
					refreshTokenPath: "/auth/graphql",
					secure: true,
					sameSite: "lax",
					publicDomainFn: (request: express.Request) => config.COOKIE_DOMAIN,
					cookieNames: {
						refreshToken: "authRefreshToken",
						guestRefreshTokenExists: "authRefreshTokenExist",
					}
				}),
				new HeaderTokenSource(),
			]),
		}),
		// ...
	],
	// ...
});
```


# Token sources
Public tokens can be passed via either HTTP headers or cookies. For browser
clients cookies are the preferred way since these are easiest to store safely in
the browser using a combination of HTTP_ONLY cookies and non-HTTP_ONLY cookies.


## Cookie Token Source
This token source is used for browser clients to safely store the token. It
differentiates the tokens using a prefix for user tokens and guest tokens.

- `userToken` / `guestToken` - The JWT token, HTTP_ONLY
- `userData` / `guestData` - Value data for keeping state, can be used to for
	example store some user information so it can be used in a frontend,
	non-HTTP_ONLY
- `refreshToken` - The refresh token, if any. It is stored as HTTP_ONLY cookie.
- `userRefreshTokenExists` / `guestRefreshTokenExists` - A boolean value that
indicates if a refresh token exists. It is used to determine if we can refresh
an existing token.


Note that this expects the "cookie-parser" express middleware to be used.


# Development
Requires Node.js >= 22 and pnpm.

```sh
pnpm install
pnpm build    # build all packages
pnpm test     # run the tests
pnpm lint     # biome check
pnpm tsc      # type check
```

# Release
Releases are managed with [changesets](https://github.com/changesets/changesets).
Add a changeset with `pnpm changeset` in your pull request. Once merged, CI
opens a release PR; merging that publishes the packages to npm.

# License
MIT
