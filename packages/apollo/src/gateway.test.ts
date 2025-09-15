import * as crypto from "node:crypto";
import { ApolloServer, HeaderMap } from "@apollo/server";
import {
	KeyManager,
	PublicFederatedToken,
	TokenSigner,
} from "@labdigital/federated-token";
import { HeaderTokenSource } from "@labdigital/federated-token-express-adapter";
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
