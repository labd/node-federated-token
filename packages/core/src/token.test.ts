import { assert, describe, test } from "vitest";
import { type AccessToken, FederatedToken } from "./token";

describe("FederatedToken", () => {
	test("setAccessToken", () => {
		const federatedToken = new FederatedToken();
		const token: AccessToken = {
			token: "exampleToken",
			exp: 1234567890,
			sub: "exampleSubject",
		};
		federatedToken.setAccessToken("exampleName", token);
		assert.equal(federatedToken.tokens.exampleName, token);
		assert.isTrue(federatedToken.isAccessTokenModified());
	});

	test("setRefreshToken", () => {
		const federatedToken = new FederatedToken();
		federatedToken.setRefreshToken("exampleName", "exampleToken");
		assert.equal(federatedToken.refreshTokens.exampleName, "exampleToken");
	});

	test("setValue", () => {
		const federatedToken = new FederatedToken();
		federatedToken.setValue("exampleName", "exampleValue");
		assert.equal(federatedToken.values["exampleName"], "exampleValue");

		const val = { example: "value" };
		federatedToken.setValue("exampleName2", val);
		assert.equal(federatedToken.values["exampleName2"], val);
	});

	test("isValueModified", () => {
		const federatedToken = new FederatedToken();
		assert.isFalse(federatedToken.isValueModified());
		federatedToken.setValue("exampleName", "exampleValue");
		assert.isTrue(federatedToken.isValueModified());
	});

	test("isAccessTokenModified", () => {
		const federatedToken = new FederatedToken();
		assert.isFalse(federatedToken.isAccessTokenModified());
		federatedToken.setAccessToken("exampleName", {
			token: "exampleToken",
			exp: 1234567890,
			sub: "exampleSubject",
		});
		assert.isTrue(federatedToken.isAccessTokenModified());
	});

	test("deserializeAccessToken", () => {
		const at = Buffer.from(
			JSON.stringify({
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: 1234567890,
						sub: "exampleSubject",
					},
				},
				values: {
					value1: "exampleValue1",
					value2: "exampleValue2",
				},
			}),
		).toString("base64");

		const federatedToken = new FederatedToken();
		federatedToken.deserializeAccessToken(at);

		assert.deepStrictEqual(
			federatedToken.tokens.exampleName,
			{
				token: "exampleToken",
				exp: 1234567890,
				sub: "exampleSubject",
			},
			"Token object should be loaded correctly",
		);

		assert.deepStrictEqual(
			federatedToken.values,
			{
				value1: "exampleValue1",
				value2: "exampleValue2",
			},
			"Values should be loaded correctly",
		);

		assert.isFalse(
			federatedToken.isAccessTokenModified(),
			"isModified should be false when trackModified is false and token is modified",
		);
	});

	test("deserializeAccessToken with trackModified = true", () => {
		const at = Buffer.from(
			JSON.stringify({
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: 1234567890,
						sub: "exampleSubject",
					},
				},
				values: {
					value1: "exampleValue1",
					value2: "exampleValue2",
				},
			}),
		).toString("base64");

		const federatedToken = new FederatedToken();
		federatedToken.deserializeAccessToken(at, true);

		assert.deepStrictEqual(
			federatedToken.tokens.exampleName,
			{
				token: "exampleToken",
				exp: 1234567890,
				sub: "exampleSubject",
			},
			"Token object should be loaded correctly",
		);

		assert.deepStrictEqual(
			federatedToken.values,
			{
				value1: "exampleValue1",
				value2: "exampleValue2",
			},
			"Values should be loaded correctly",
		);

		assert.isTrue(
			federatedToken.isAccessTokenModified(),
			"isModified should be true when trackModified is true and token is modified",
		);
		assert.isTrue(
			federatedToken.isValueModified(),
			"isModified should be true when trackModified is true and value is modified",
		);
	});

	test("deserializeAccessToken keeps an earlier token change when a later response only changes values", () => {
		const tokens = {
			exampleName: {
				token: "newToken",
				exp: 1234567890,
				sub: "exampleSubject",
			},
		};
		const federatedToken = new FederatedToken();
		federatedToken.deserializeAccessToken(
			Buffer.from(JSON.stringify({ tokens })).toString("base64"),
			true,
		);
		federatedToken.deserializeAccessToken(
			Buffer.from(
				JSON.stringify({ tokens, values: { value1: "exampleValue1" } }),
			).toString("base64"),
			true,
		);

		assert.isTrue(federatedToken.isAccessTokenModified());
		assert.isTrue(federatedToken.isValueModified());
	});

	test("deserializeAccessToken keeps an earlier value change when a later response only changes tokens", () => {
		const values = { value1: "exampleValue1" };
		const federatedToken = new FederatedToken();
		federatedToken.deserializeAccessToken(
			Buffer.from(JSON.stringify({ values })).toString("base64"),
			true,
		);
		federatedToken.deserializeAccessToken(
			Buffer.from(
				JSON.stringify({
					tokens: {
						exampleName: {
							token: "newToken",
							exp: 1234567890,
							sub: "exampleSubject",
						},
					},
					values,
				}),
			).toString("base64"),
			true,
		);

		assert.isTrue(federatedToken.isValueModified());
		assert.isTrue(federatedToken.isAccessTokenModified());
	});

	test("serializeAccessToken empty", () => {
		const federatedToken = new FederatedToken();
		federatedToken.setAccessToken("exampleName", {
			token: "exampleToken",
			exp: 1234567890,
			sub: "exampleSubject",
		});

		const serialized = Buffer.from(
			JSON.stringify({
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: 1234567890,
						sub: "exampleSubject",
					},
				},
			}),
		).toString("base64");

		assert.equal(federatedToken.serializeAccessToken(), serialized);
	});

	test("serializeAccessToken", () => {
		const federatedToken = new FederatedToken();
		federatedToken.setIsAuthenticated();
		federatedToken.setAccessToken("exampleName", {
			token: "exampleToken",
			exp: 1234567890,
			sub: "exampleSubject",
		});
		federatedToken.values = {
			value1: "exampleValue1",
			value2: "exampleValue2",
		};

		const serialized = Buffer.from(
			JSON.stringify({
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: 1234567890,
						sub: "exampleSubject",
					},
				},
				values: {
					value1: "exampleValue1",
					value2: "exampleValue2",
				},
				isAuthenticated: true,
			}),
		).toString("base64");

		assert.equal(federatedToken.serializeAccessToken(), serialized);
	});

	test("loadRefreshToken", () => {
		const value = Buffer.from(
			JSON.stringify({
				exampleName: "exampleToken",
			}),
		).toString("base64");

		const federatedToken = new FederatedToken();
		federatedToken.loadRefreshToken(value);

		assert.deepStrictEqual(
			federatedToken.refreshTokens,
			{
				exampleName: "exampleToken",
			},
			"Refresh tokens should be loaded correctly",
		);
	});

	test("dumpRefreshToken", () => {
		const federatedToken = new FederatedToken();
		federatedToken.refreshTokens = {
			exampleName: "exampleToken",
		};

		const expectedDump = Buffer.from(
			JSON.stringify({
				exampleName: "exampleToken",
			}),
		).toString("base64");

		assert.equal(federatedToken.dumpRefreshToken(), expectedDump);
	});
});
