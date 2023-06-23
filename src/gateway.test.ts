import { ApolloServer, GraphQLRequestMetrics, HeaderMap } from "@apollo/server";
import { GatewayAuthPlugin } from "./gateway";
import {
	PublicFederatedToken,
	PublicFederatedTokenContext,
	TokenSigner,
} from "./jwt";
import { assert, describe, expect, it } from "vitest";

describe("GatewayAuthPlugin", () => {
	const signer = new TokenSigner({
		audience: "exampleAudience",
		issuer: "exampleIssuer",
		encryptKey: "foo",
		signKey: "bar",
	});
	const plugin = new GatewayAuthPlugin(signer);

	const typeDefs = `#graphql
 			type Query {
    		testToken(create: Boolean): String!
  		}
	`;
	const resolvers = {
		Query: {
			testToken: (
				_: any,
				{ create }: { create: boolean },
				context: PublicFederatedTokenContext
			) => {
				if (create) {
					context.federatedToken?.setAccessToken("foo", {
						token: "bar",
						exp: Date.now() + 1000,
					});
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
		const headers = new HeaderMap();
		const context = {
			federatedToken: new PublicFederatedToken(),
		};
		const response = await testServer.executeOperation(
			{
				query: "query testToken { testToken(create: true) }",
				http: { headers: headers, method: "POST", search: "", body: "" },
			},
			{
				contextValue: context,
			}
		);
		assert.exists(response.http.headers.get("x-access-token"));
		assert.exists(response.http.headers.get("x-refresh-token"));
	});

	it("Use generated token", async () => {
		let headers = new HeaderMap();
		let context = {
			federatedToken: new PublicFederatedToken(),
		};
		let response = await testServer.executeOperation(
			{
				query: "query testToken { testToken(create: true) }",
				http: { headers: headers, method: "POST", search: "", body: "" },
			},
			{
				contextValue: context,
			}
		);
		assert.exists(response.http.headers.get("x-access-token"));
		assert.exists(response.http.headers.get("x-refresh-token"));

		// Set received token
		headers = new HeaderMap();
		headers.set(
			"Authorization",
			"Bearer " + response.http.headers.get("x-access-token")
		);
		context = {
			federatedToken: new PublicFederatedToken(),
		};
		response = await testServer.executeOperation(
			{
				query: "query testToken { testToken(create: false) }",
				http: { headers: headers, method: "POST", search: "", body: "" },
			},
			{
				contextValue: context,
			}
		);
		assert.equal(response.body.kind, "single");
		assert(response.body.kind === "single");

		const token = JSON.parse(
			response.body.singleResult.data?.testToken as string
		) as PublicFederatedToken;
		expect(token.tokens.foo.token).toBe("bar");
		expect(response.http.headers.get("x-access-token")).toBeUndefined();
		expect(response.http.headers.get("x-refresh-token")).toBeUndefined();
	});
});
