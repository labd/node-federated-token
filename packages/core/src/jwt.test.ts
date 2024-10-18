import * as crypto from "crypto";
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
		const expireAt = Date.now() + 60;
		token.tokens = {
			exampleName: {
				token: "exampleToken",
				exp: expireAt,
				sub: "exampleSubject",
			},
		};
		token.values = {
			value1: "exampleValue1",
			value2: "exampleValue2",
		};

		const accessToken = await token.createAccessJWT(signer);
		const dataToken = await token.createDataJWT(signer);

		const newToken = new PublicFederatedToken();
		await newToken.loadAccessJWT(signer, accessToken, dataToken);
		expect(newToken.tokens).toStrictEqual(token.tokens);
		expect(newToken.refreshTokens).toStrictEqual(token.refreshTokens);
		expect(newToken.values).toStrictEqual(token.values);
	});

	test("createAccessJWT with TokenSigner create hook", async () => {
		const signer = new TokenSigner({
			...signOptions,
			getSubject: (token) => token.tokens.exampleName?.sub,
		});

		const token = new PublicFederatedToken();
		const expireAt = Date.now() + 60;
		token.tokens = {
			exampleName: {
				token: "exampleToken",
				exp: expireAt,
				sub: "exampleSubject",
			},
		};
		token.values = {
			value1: "exampleValue1",
			value2: "exampleValue2",
		};

		const accessToken = await token.createAccessJWT(signer);
		const dataToken = await token.createDataJWT(signer);

		const newToken = new PublicFederatedToken();
		await newToken.loadAccessJWT(signer, accessToken, dataToken);
		expect(newToken.tokens).toStrictEqual(token.tokens);
		expect(newToken.refreshTokens).toStrictEqual(token.refreshTokens);
		expect(newToken.values).toStrictEqual(token.values);
	});

	test("loadAccessJWT", async () => {
		const time = 1729258233173;

		const dataJWT = await signer.signJWT({
			exp: Date.now() + 1000,
			values: {
				value1: "exampleValue1",
				value2: "exampleValue2",
			},
		});
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
			Date.now() + 1000,
		);

		const token = new PublicFederatedToken();
		await token.loadAccessJWT(signer, tokenJWT, dataJWT);
		expect(token.tokens).toStrictEqual({
			exampleName: {
				token: "exampleToken",
				exp: time,
				sub: "exampleSubject",
			},
		});
		expect(token.values).toStrictEqual({
			value1: "exampleValue1",
			value2: "exampleValue2",
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
});
