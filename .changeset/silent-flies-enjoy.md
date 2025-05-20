---
"@labdigital/federated-token-express-adapter": minor
"@labdigital/federated-token-fastify-adapter": minor
"@labdigital/federated-token": minor
---

Add ability to set custom expires time for the various cookies. For example:

```ts
		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
			userToken: {
				expiresIn: 30 * 24 * 60 * 60, // 30 days
			}
		});

```

This will set the user token cookie to expire in 30 days. The default value is when
the browser is closed.
