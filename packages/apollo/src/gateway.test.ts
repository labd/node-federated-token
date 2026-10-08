import * as crypto from "node:crypto";
import { ApolloServer, HeaderMap } from "@apollo/server";
import {
	CompositeTokenSource,
	KeyManager,
	PublicFederatedToken,
	TokenSigner,
} from "@labdigital/federated-token";
import {
	CookieTokenSource,
	HeaderTokenSource,
} from "@labdigital/federated-token-express-adapter";
import type { Request, Response } from "express";
import httpMocks from "node-mocks-http";
import { assert, describe, expect, it } from "vitest";
import type { PublicFederatedTokenContext } from "./context";
import { GatewayAuthPlugin } from "./gateway";

describe("GatewayAuthPlugin", async () => {
	const signOptions = {
		encryptKeys: new KeyManager([
			{
				id: "1",
				key: crypto.createSecretKey(Buffer.from("12345678".repeat(4))),
			},
		]),
		signKeys: new KeyManager([
			{
				id: "1",
				key: crypto.createSecretKey(Buffer.from("87654321".repeat(4))),
			},
		]),
		audience: "exampleAudience",
		issuer: "exampleIssuer",
	};

	const signer = new TokenSigner(signOptions);

	const plugin = new GatewayAuthPlugin({
		signer: signer,
		source: new HeaderTokenSource(),
	});

	const typeDefs = `#graphql
	type Query {
		hello(name: String): String!
		testToken(create: Boolean, value: String): String!
		refreshToken: String!
	}
	type Mutation {
		createToken(create: Boolean, value: String, expired: Boolean): String!
	}
	`;
	const resolvers = {
		Query: {
			testToken: (
				_: unknown,
				{ create, value }: { create: boolean; value: string },
				context: PublicFederatedTokenContext<Request, Response>,
			) => {
				if (!context.federatedToken) {
					throw new Error("No federated token");
				}
				if (create) {
					context.federatedToken.setAccessToken("foo", {
						token: "bar",
						exp: Math.floor(Date.now() / 1000 + 1000),
						sub: "my-user-id",
					});
					context.federatedToken.setRefreshToken("foo", "bar");
				}

				if (value) {
					context.federatedToken.setValue("value", value);
				}

				return JSON.stringify(context.federatedToken);
			},
			hello: (
				_: unknown,
				{ name }: { name: string },
				context: PublicFederatedTokenContext<Request, Response>,
			) => {
				return `Hello ${name}`;
			},
			refreshToken: (
				_: unknown,
				context: PublicFederatedTokenContext<Request, Response>,
			) => {
				context.federatedToken?.setAccessToken("foo", {
					token: "bar",
					exp: Math.floor(Date.now() / 1000 - 1000),
					sub: "my-user-id",
				});
				return JSON.stringify(context.federatedToken);
			},
		},
		Mutation: {
			createToken: (
				_: unknown,
				{
					create,
					value,
					expired,
				}: { create: boolean; value: string; expired: boolean },
				context: PublicFederatedTokenContext<Request, Response>,
			) => {
				if (!context.federatedToken) {
					throw new Error("No federated token");
				}
				if (create) {
					context.federatedToken.setAccessToken("foo", {
						token: "bar",
						exp: Math.floor(
							expired ? Date.now() / 1000 - 1000 : Date.now() / 1000 + 1000,
						),
						sub: "my-user-id",
					});
					context.federatedToken.setRefreshToken("foo", "bar");
				}

				if (value) {
					context.federatedToken.setValue("value", value);
				}

				return JSON.stringify(context.federatedToken);
			},
		},
	};

	const testServer = new ApolloServer({
		typeDefs,
		resolvers,
		plugins: [plugin],
	});

	it("should return the plugin instance", async () => {
		const context: PublicFederatedTokenContext<Request, Response> = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest(),
		};
		await testServer.executeOperation(
			{
				query: "query testToken { testToken(create: true) }",
				http: {
					headers: new HeaderMap(),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: context,
			},
		);
		expect(context.res.statusCode).toBe(200);
		expect(context.res.get("x-access-token")).toBeDefined();
		expect(context.res.get("x-refresh-token")).toBeDefined();
	});

	it("Use generated token", async () => {
		const context = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest(),
		};
		await testServer.executeOperation(
			{
				query: "query testToken { testToken(create: true) }",
				http: {
					headers: new HeaderMap(),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: context,
			},
		);
		expect(context.res.statusCode).toBe(200);
		expect(context.res.get("x-access-token")).toBeDefined();
		expect(context.res.get("x-refresh-token")).toBeDefined();
		const accessToken = context.res.get("x-access-token");

		// Set received token
		const newContext = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest({
				headers: {
					"x-access-token": `Bearer ${accessToken}`,
				},
			}),
		};
		const response = await testServer.executeOperation(
			{
				query: "query testToken { testToken(create: false) }",
				http: {
					headers: new HeaderMap(),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: newContext,
			},
		);
		expect(response.body.kind).toBe("single");
		assert(response.body.kind === "single"); // Make typescript happy
		expect(response.body.singleResult).toBeDefined();

		const token = JSON.parse(
			response.body.singleResult.data?.testToken as string,
		) as PublicFederatedToken;
		expect(token.tokens.foo.token).toBe("bar");
		expect(newContext.res.get("x-access-token")).toBeUndefined();
		expect(newContext.res.get("x-refresh-token")).toBeUndefined();
	});

	it("updates token on value change", async () => {
		const context = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest(),
		};
		await testServer.executeOperation(
			{
				query: "query testToken { testToken(create: true) }",
				http: {
					headers: new HeaderMap(),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: context,
			},
		);
		expect(context.res.statusCode).toBe(200);
		expect(context.res.get("x-access-token")).toBeDefined();
		expect(context.res.get("x-refresh-token")).toBeDefined();
		const accessToken = context.res.get("x-access-token");

		// Set received token
		const newContext = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest({
				headers: {
					"x-access-token": `Bearer ${accessToken}`,
				},
			}),
		};

		await testServer.executeOperation(
			{
				query: 'query testToken { testToken(value: "foobar") }',
				http: {
					headers: new HeaderMap(),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: newContext,
			},
		);
		const newAccessToken = newContext.res.get("x-data-token");

		assert.isNotEmpty(newAccessToken);
		assert.notEqual(newAccessToken, accessToken);
	});

	it("should clear invalid refresh token and let request reach resolver", async () => {
		const wrongAudienceSigner = new TokenSigner({
			...signOptions,
			audience: "wrongAudience",
		});

		const token = new PublicFederatedToken();
		token.setRefreshToken("commercetools", "stale-refresh-value");
		const staleRefreshToken = await token.createRefreshJWT(wrongAudienceSigner);

		const cookieSource = new CookieTokenSource({
			refreshTokenPath: "/auth/graphql",
			secure: false,
			sameSite: "lax",
		});

		const cookiePlugin = new GatewayAuthPlugin({
			signer: signer,
			source: new CompositeTokenSource([cookieSource]),
		});

		const cookieServer = new ApolloServer({
			typeDefs,
			resolvers,
			plugins: [cookiePlugin],
		});

		const context = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest({
				cookies: {
					refreshToken: staleRefreshToken,
				},
			}),
		};

		const response = await cookieServer.executeOperation(
			{
				query: 'query hello { hello(name: "world") }',
				http: {
					headers: new HeaderMap(),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: context,
			},
		);

		// The request should reach the resolver instead of being blocked with a 401
		assert(response.body.kind === "single");
		expect(response.body.singleResult.data?.hello).toBe("Hello world");
		expect(response.body.singleResult.errors).toBeUndefined();

		// The refresh token cookie should be cleared
		expect(context.res.cookies.refreshToken).toBeDefined();
		expect(context.res.cookies.refreshToken.value).toBe("");
		expect(context.res.cookies.refreshToken.options.expires).toBeDefined();
	});

	it.each([
		{
			access: "expired",
			data: "expired",
			refresh: "valid",
			outcome: "continues",
			cleared: ["userToken", "userData"],
		},
		{
			access: "expired",
			data: "valid",
			refresh: "invalid",
			outcome: "UNAUTHENTICATED",
			cleared: ["userToken", "refreshToken"],
		},
		{
			access: "valid",
			data: "expired",
			refresh: "invalid",
			outcome: "UNAUTHENTICATED",
			cleared: ["userData", "refreshToken"],
		},
		{
			access: "invalid",
			data: "valid",
			refresh: "valid",
			outcome: "INVALID_TOKEN",
			cleared: ["userToken", "userData", "refreshToken"],
		},
		{
			access: "valid",
			data: "invalid",
			refresh: "valid",
			outcome: "INVALID_TOKEN",
			cleared: ["userToken", "userData", "refreshToken"],
		},
		{
			access: "expired",
			data: "invalid",
			refresh: "absent",
			outcome: "INVALID_TOKEN",
			cleared: ["userToken", "userData", "refreshToken"],
		},
	] as const)(
		"$access access, $data data and $refresh refresh tokens: $outcome",
		async ({ access, data, refresh, outcome, cleared }) => {
			const now = Math.floor(Date.now() / 1000);
			const token = new PublicFederatedToken();
			token.setAccessToken("foo", {
				token: "bar",
				exp: access === "expired" ? now - 1000 : now + 1000,
				sub: "my-user-id",
			});
			token.setRefreshToken("foo", "refresh-value");
			const cookies = {
				userToken:
					access === "invalid"
						? "invalid"
						: await token.createAccessJWT(signer),
				userData:
					data === "invalid"
						? "invalid"
						: await signer.signJWT({
								values: { value: "foobar" },
								exp: data === "expired" ? now - 1000 : now + 1000,
							}),
				...(refresh !== "absent" && {
					refreshToken:
						refresh === "valid"
							? await token.createRefreshJWT(signer)
							: "invalid",
				}),
			};

			const cookieServer = new ApolloServer({
				typeDefs,
				resolvers,
				plugins: [
					new GatewayAuthPlugin({
						signer: signer,
						source: new CookieTokenSource({
							refreshTokenPath: "/auth/graphql",
							secure: false,
							sameSite: "lax",
						}),
					}),
				],
			});

			const context = {
				federatedToken: new PublicFederatedToken(),
				res: httpMocks.createResponse(),
				req: httpMocks.createRequest({ cookies }),
			};

			const response = await cookieServer.executeOperation(
				{ query: "query testToken { testToken(create: false) }" },
				{ contextValue: context },
			);

			assert(response.body.kind === "single");
			const { data: result, errors } = response.body.singleResult;
			for (const name of ["userToken", "userData", "refreshToken"] as const) {
				expect(context.res.cookies[name]?.value).toBe(
					(cleared as readonly string[]).includes(name) ? "" : undefined,
				);
			}
			if (outcome === "continues") {
				expect(errors).toBeUndefined();
				const resolverToken = JSON.parse(
					result?.testToken as string,
				) as PublicFederatedToken;
				expect(resolverToken.tokens).toStrictEqual({});
				expect(resolverToken.refreshTokens).toStrictEqual({
					foo: "refresh-value",
				});
			} else {
				expect(response.http.status).toBe(401);
				expect(errors?.[0]?.extensions?.code).toBe(outcome);
			}
		},
	);

	it("should return GraphQLError when token expired", async () => {
		const context = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest(),
		};
		await testServer.executeOperation(
			{
				query:
					"mutation createToken { createToken(create: true, expired: true) }",
				http: {
					headers: new HeaderMap(),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: context,
			},
		);
		expect(context.res.statusCode).toBe(200);
		expect(context.res.get("x-access-token")).toBeDefined();
		expect(context.res.get("x-refresh-token")).toBeDefined();
		const accessToken = context.res.get("x-access-token");

		// Set received token
		const newContext = {
			federatedToken: new PublicFederatedToken(),
			res: httpMocks.createResponse(),
			req: httpMocks.createRequest({
				headers: {
					"x-access-token": `Bearer ${accessToken}`,
				},
			}),
		};

		const response = await testServer.executeOperation(
			{
				query: 'query hello { hello(name: "foobar") }',
				http: {
					headers: new HeaderMap([["x-access-token", `Bearer ${accessToken}`]]),
					method: "POST",
					search: "",
					body: "",
				},
			},
			{
				contextValue: newContext,
			},
		);

		expect(response.http.status).toBe(401);
		assert(response.body.kind === "single"); // Make typescript happy
		const errors = response.body.singleResult.errors;
		expect(errors).toStrictEqual([
			{
				extensions: {
					code: "UNAUTHENTICATED",
				},
				message: "Your token has expired.",
			},
		]);
	});
});
