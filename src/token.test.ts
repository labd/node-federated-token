import { assert, describe, test } from "vitest";
import { AccessToken, FederatedToken } from "./token.js";

describe("FederatedToken", () => {
	test("setAccessToken", () => {
		const federatedToken = new FederatedToken();
		const token: AccessToken = {
			token: "exampleToken",
			exp: 1234567890,
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
		});
		assert.isTrue(federatedToken.isAccessTokenModified());
	});

	test("loadAccessToken", () => {
		const at = Buffer.from(
			JSON.stringify({
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: 1234567890,
					},
				},
				value1: "exampleValue1",
				value2: "exampleValue2",
			})
		).toString("base64");

		const federatedToken = new FederatedToken();
		federatedToken.loadAccessToken(at);

		assert.deepStrictEqual(
			federatedToken.tokens.exampleName,
			{
				token: "exampleToken",
				exp: 1234567890,
			},
			"Token object should be loaded correctly"
		);

		assert.deepStrictEqual(
			federatedToken.values,
			{
				value1: "exampleValue1",
				value2: "exampleValue2",
			},
			"Values should be loaded correctly"
		);

		assert.isFalse(
			federatedToken.isAccessTokenModified(),
			"isModified should be false when trackModified is false and token is modified"
		);
	});

	test("loadAccessToken with trackModified = true", () => {
		const at = Buffer.from(
			JSON.stringify({
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: 1234567890,
					},
				},
				value1: "exampleValue1",
				value2: "exampleValue2",
			})
		).toString("base64");

		const federatedToken = new FederatedToken();
		federatedToken.loadAccessToken(at, true);

		assert.deepStrictEqual(
			federatedToken.tokens.exampleName,
			{
				token: "exampleToken",
				exp: 1234567890,
			},
			"Token object should be loaded correctly"
		);

		assert.deepStrictEqual(
			federatedToken.values,
			{
				value1: "exampleValue1",
				value2: "exampleValue2",
			},
			"Values should be loaded correctly"
		);

		assert.isTrue(
			federatedToken.isAccessTokenModified(),
			"isModified should be true when trackModified is true and token is modified"
		);
	});

	test("dumpAccessToken", () => {
		const federatedToken = new FederatedToken();
		federatedToken.setAccessToken("exampleName", {
			token: "exampleToken",
			exp: 1234567890,
		});
		federatedToken.values = {
			value1: "exampleValue1",
			value2: "exampleValue2",
		};

		const expectedDump = Buffer.from(
			JSON.stringify({
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: 1234567890,
					},
				},
				value1: "exampleValue1",
				value2: "exampleValue2",
			})
		).toString("base64");

		assert.equal(federatedToken.dumpAccessToken(), expectedDump);
	});

	test("loadRefreshToken", () => {
		const value = Buffer.from(
			JSON.stringify({
				exampleName: "exampleToken",
			})
		).toString("base64");

		const federatedToken = new FederatedToken();
		federatedToken.loadRefreshToken(value);

		assert.deepStrictEqual(
			federatedToken.refreshTokens,
			{
				exampleName: "exampleToken",
			},
			"Refresh tokens should be loaded correctly"
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
			})
		).toString("base64");

		assert.equal(federatedToken.dumpRefreshToken(), expectedDump);
	});
});
