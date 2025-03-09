import * as crypto from "node:crypto";
import { describe, expect, test } from "vitest";
import { PublicFederatedToken } from "./jwt";
import { KeyManager, TokenSigner } from "./sign";

describe("PublicFederatedToken", async () => {
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

	test("createAccessJWT", async () => {
		const token = new PublicFederatedToken();
		const expireAt = Math.floor(Date.now() / 1000 + 60);
		token.tokens = {
			exampleName: {
				token: "exampleToken",
				exp: expireAt,
				sub: "exampleSubject",
			},
		};
		const accessToken = await token.createAccessJWT(signer);

		const newToken = new PublicFederatedToken();
		await newToken.loadAccessJWT(signer, accessToken);
		expect(newToken.tokens).toStrictEqual(token.tokens);
	});

	test("createAccessJWT with TokenSigner create hook", async () => {
		const signer = new TokenSigner({
			...signOptions,
			getSubject: (token) => token.tokens.exampleName?.sub,
		});

		const token = new PublicFederatedToken();
		const expireAt = Math.floor(Date.now() / 1000 + 60);
		token.tokens = {
			exampleName: {
				token: "exampleToken",
				exp: expireAt,
				sub: "exampleSubject",
			},
		};
		const accessToken = await token.createAccessJWT(signer);

		const newToken = new PublicFederatedToken();
		await newToken.loadAccessJWT(signer, accessToken);
		expect(newToken.tokens).toStrictEqual(token.tokens);
	});

	test("loadAccessJWT", async () => {
		const time = 1729258233173;
		const tokenJWT = await signer.encryptJWT(
			{
				tokens: {
					exampleName: {
						token: "exampleToken",
						exp: time,
						sub: "exampleSubject",
					},
				},
			},
			Math.floor(Date.now() / 1000 + 1000),
		);

		const token = new PublicFederatedToken();
		await token.loadAccessJWT(signer, tokenJWT);
		expect(token.tokens).toStrictEqual({
			exampleName: {
				token: "exampleToken",
				exp: time,
				sub: "exampleSubject",
			},
		});
	});

	test("createRefreshJWT", async () => {
		// Write tests for createRefreshJWT if needed
		const token = new PublicFederatedToken();
		token.refreshTokens = {
			value1: "exampleValue1",
		};

		const jwt = await token.createRefreshJWT(signer);
		expect(jwt).toBeDefined();
	});

	test("loadRefreshJWT", async () => {
		const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
		const payload = {
			values: { value1: "exampleValue1" },
			exp,
		};

		const jwt = await signer.encryptJWT(payload, exp);

		const token = new PublicFederatedToken();
		await token.loadRefreshJWT(signer, jwt);
		expect(token.refreshTokens).toBeDefined();
		expect(token.refreshTokens.values).toStrictEqual(payload.values);
	});

	test("createDataJWT", async () => {
		// Write tests for createRefreshJWT if needed
		const token = new PublicFederatedToken();
		token.values = {
			value1: "exampleValue1",
			value2: "exampleValue2",
		};

		const jwt = await token.createDataJWT(signer);
		expect(jwt).toBeDefined();
	});

	test("loadDataJWT", async () => {
		const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
		const payload = {
			values: { value1: "exampleValue1" },
			exp,
		};

		const jwt = await signer.signJWT(payload);

		const token = new PublicFederatedToken();
		await token.loadDataJWT(signer, jwt);
		expect(token.values).toBeDefined();
		expect(token.values).toStrictEqual(payload.values);
	});
});
