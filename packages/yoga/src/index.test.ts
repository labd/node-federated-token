import { createSchema, createYoga } from "graphql-yoga";
import { describe, it, expect } from "vitest";
import { useFederatedToken } from ".";
import { FederatedToken } from "@labdigital/federated-token";

type FederatedTokenContext = {
	federatedToken: FederatedToken;
};

export function assertSingleValue<TValue extends object>(
	value: TValue | AsyncIterable<TValue>,
): asserts value is TValue {
	if (Symbol.asyncIterator in value) {
		throw new Error("Expected single value");
	}
}

describe("useFederatdToken()", () => {
	const schemaFactory = async () => {
		return createSchema<FederatedTokenContext>({
			typeDefs: /* GraphQL */ `
				type Query {
					tokenData: String
				}
				type Mutation {
					createToken(service: String!): Boolean
				}
			`,
			resolvers: {
				Query: {
					tokenData: (parent, args, context) => {
						return JSON.stringify({
							tokens: context.federatedToken.tokens,
							values: context.federatedToken.values,
							refreshTokens: context.federatedToken.refreshTokens,
						});
					},
				},
				Mutation: {
					createToken: (parent, args, context) => {
						context.federatedToken.setAccessToken(args.service, {
							token: "test",
							exp: 123,
							sub: "test",
						});
						context.federatedToken.setRefreshToken(
							args.service,
							"refresh-token",
						);
						return true;
					},
				},
			},
		});
	};

	const yoga = createYoga<FederatedTokenContext>({
		schema: schemaFactory,
		plugins: [useFederatedToken()],
		context: () => {
			return {
				federatedToken: new FederatedToken(),
			};
		},
	});

	it("should handle missing tokens", async () => {
		const response = await yoga.fetch("http://localhost:3000/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: "{ tokenData }",
			}),
		});
		const content = await response.json();
		assertSingleValue(content);
	});

	it("should load access and refresh tokens", async () => {
		const token = new FederatedToken();
		token.setValue("my-service", { foo: "bar" });
		token.setAccessToken("my-service", { token: "bar", exp: 123, sub: "test" });
		token.setRefreshToken("my-service", "refresh-token");

		const response = await yoga.fetch("http://localhost:3000/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Access-Token": token.serializeAccessToken() ?? "",
				"X-Refresh-Token": token.dumpRefreshToken() ?? "",
			},
			body: JSON.stringify({
				query: "{ tokenData }",
			}),
		});
		const content = await response.json();

		assertSingleValue(content);

		const result = JSON.parse(content.data.tokenData);
		expect(result).toEqual({
			tokens: {
				"my-service": {
					token: "bar",
					exp: 123,
					sub: "test",
				},
			},
			values: {
				"my-service": {
					foo: "bar",
				},
			},
			refreshTokens: {
				"my-service": "refresh-token",
			},
		});

		expect(response.headers.has("X-Access-Token")).toBe(false);
		expect(response.headers.has("X-Refresh-Token")).toBe(false);
	});

	it("should create new token", async () => {
		const response = await yoga.fetch("http://localhost:3000/graphql", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				query: `mutation { createToken(service: "foobar") }`,
			}),
		});
		const content = await response.json();
		assertSingleValue(content);

		expect(response.headers.has("X-Access-Token")).toBe(true);
		expect(response.headers.has("X-Refresh-Token")).toBe(true);

		const accessToken = response.headers.get("X-Access-Token");
		const refreshToken = response.headers.get("X-Refresh-Token");

		expect(accessToken).toBeDefined();
		expect(refreshToken).toBeDefined();
	});
});
