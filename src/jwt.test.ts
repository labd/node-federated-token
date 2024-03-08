import * as crypto from "crypto";
import { describe, expect, test } from "vitest";
import { generateFingerprint, hashFingerprint } from "./fingerprint";
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

		const { accessToken, fingerprint } = await token.createAccessJWT(signer);

		expect(fingerprint).lengthOf(32);

		const newToken = new PublicFederatedToken();
		await newToken.loadAccessJWT(signer, accessToken, fingerprint);
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

		const { accessToken, fingerprint } = await token.createAccessJWT(signer);

		expect(fingerprint).lengthOf(32);

		const newToken = new PublicFederatedToken();
		await newToken.loadAccessJWT(signer, accessToken, fingerprint);
		expect(newToken.tokens).toStrictEqual(token.tokens);
		expect(newToken.refreshTokens).toStrictEqual(token.refreshTokens);
		expect(newToken.values).toStrictEqual(token.values);
	});

	test("loadAccessJWT", async () => {
		const token = new PublicFederatedToken();
		const exampleJWT = await signer.signJWT({
			exp: Date.now() + 1000,
			jwe: await signer.encryptObject(token.tokens),
			value1: "exampleValue1",
			value2: "exampleValue2",
		});

		await token.loadAccessJWT(signer, exampleJWT);

		const result = await signer.verifyJWT(exampleJWT);
		expect(token.tokens).toStrictEqual(
			await signer.decryptObject(result.payload.jwe as string)
		);
		expect(token.values).toStrictEqual({
			value1: "exampleValue1",
			value2: "exampleValue2",
		});
	});

	test("loadAccessJWT with Fingerprint", async () => {
		const token = new PublicFederatedToken();
		const fingerprint = generateFingerprint();
		const exampleJWT = await signer.signJWT({
			exp: Date.now() + 1000,
			jwe: await signer.encryptObject(token.tokens),
			value1: "exampleValue1",
			value2: "exampleValue2",
			_fingerprint: hashFingerprint(fingerprint),
		});

		expect(fingerprint).lengthOf(32);
		await token.loadAccessJWT(signer, exampleJWT, fingerprint);

		const result = await signer.verifyJWT(exampleJWT);
		expect(token.tokens).toStrictEqual(
			await signer.decryptObject(result.payload.jwe as string)
		);
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
