import { ApolloServer, HeaderMap } from "@apollo/server";
import { GatewayAuthPlugin } from "./gateway";
import {
	PublicFederatedToken,
	PublicFederatedTokenContext,
	TokenSigner,
} from "./jwt";
import { assert, describe, expect, it } from "vitest";
import httpMocks from "node-mocks-http";
import { HeaderTokenSource } from "./tokensource";

describe("GatewayAuthPlugin", () => {
	const signer = new TokenSigner({
		audience: "exampleAudience",
		issuer: "exampleIssuer",
		encryptKey: "foo",
		signKey: "bar",
	});

	const plugin = new GatewayAuthPlugin({
		signer: signer,
		source: new HeaderTokenSource(),
	});

	const typeDefs = `#graphql
 			type Query {
				testToken(create: Boolean): String!
				refreshToken: String!
			}
	`;
	const resolvers = {
		Query: {
			testToken: (
				_: any,
				{ create }: { create: boolean },
				context: PublicFederatedTokenContext
			) => {
				if (!context.federatedToken) {
					throw new Error("No federated token");
				}
				if (create) {
					context.federatedToken.setAccessToken("foo", {
						token: "bar",
						exp: Date.now() + 1000,
					});
					context.federatedToken.setRefreshToken("foo", "bar");
				}
				return JSON.stringify(context.federatedToken);
			},
			refreshToken: (_: any, context: PublicFederatedTokenContext) => {
				context.federatedToken?.setAccessToken("foo", {
					token: "bar",
					exp: Date.now() + 1000,
				});
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
			}
		);
		expect(context.res.statusCode).toBe(200);
		expect(context.res.get("x-access-token")).toBeDefined();
		expect(context.res.get("x-refresh-token")).toBeDefined();
	});

	it("Use generated token", async () => {
		let context = {
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
			}
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
			}
		);
		expect(response.body.kind).toBe("single");
		assert(response.body.kind === "single"); // Make typescript happy
		expect(response.body.singleResult).toBeDefined();

		const token = JSON.parse(
			response.body.singleResult.data?.testToken as string
		) as PublicFederatedToken;
		expect(token.tokens.foo.token).toBe("bar");
		expect(newContext.res.get("x-access-token")).toBeUndefined();
		expect(newContext.res.get("x-refresh-token")).toBeUndefined();
	});
});
