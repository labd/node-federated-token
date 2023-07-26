import * as jose from "jose";
import { describe, expect, test } from "vitest";
import { PublicFederatedToken, TokenSigner } from "./jwt";
import { generateFingerprint, hashFingerprint } from "./fingerprint";

describe("PublicFederatedToken", async () => {
	const signOptions = {
		encryptKey: "jabja buqb uibafjb jdbuieqb ajfbajfsa",
		signKey: "alsdlasdasd",
		audience: "exampleAudience",
		issuer: "exampleIssuer",
	};
	const signer = new TokenSigner(signOptions);

	test("encryptTokens", () => {
		const publicFederatedToken = new PublicFederatedToken();
		publicFederatedToken.tokens = {
			exampleName: {
				token: "exampleToken",
				exp: 1234567890,
			},
		};

		const encryptedData = publicFederatedToken.encryptTokens(signer);
		const decryptedData = signer.decryptString(encryptedData);

		const expectedData = JSON.stringify(publicFederatedToken.tokens);
		expect(decryptedData).toStrictEqual(expectedData);
	});

	test("decryptTokens", () => {
		const publicFederatedToken = new PublicFederatedToken();
		const encryptedData = signer.encryptString(
			JSON.stringify({
				exampleName: {
					token: "exampleToken",
					exp: 1234567890,
				},
			})
		);

		const decryptedData = publicFederatedToken.decryptTokens(
			signer,
			encryptedData
		);

		const expectedData = {
			exampleName: {
				token: "exampleToken",
				exp: 1234567890,
			},
		};

		expect(decryptedData).toStrictEqual(expectedData);
	});

	test("createAccessJWT", async () => {
		const token = new PublicFederatedToken();
		const expireAt = Date.now() + 60;
		token.tokens = {
			exampleName: {
				token: "exampleToken",
				exp: expireAt,
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
		const publicFederatedToken = new PublicFederatedToken();
		const exampleJWT = await signer.signJWT(
			{
				exp: Date.now() + 1000,
				state: publicFederatedToken.encryptTokens(signer),
				value1: "exampleValue1",
				value2: "exampleValue2",
			},
			Date.now() + 1000
		);

		await publicFederatedToken.loadAccessJWT(signer, exampleJWT);

		const result = await signer.verifyJWT(exampleJWT);
		expect(publicFederatedToken.tokens).toStrictEqual(
			publicFederatedToken.decryptTokens(signer, result.payload.state as string)
		);
		expect(publicFederatedToken.values).toStrictEqual({
			value1: "exampleValue1",
			value2: "exampleValue2",
		});
	});

	test("loadAccessJWT with Fingerprint", async () => {
		const publicFederatedToken = new PublicFederatedToken();
		const fingerprint = generateFingerprint();
		const exampleJWT = await signer.signJWT(
			{
				exp: Date.now() + 1000,
				state: publicFederatedToken.encryptTokens(signer),
				value1: "exampleValue1",
				value2: "exampleValue2",
				_fingerprint: hashFingerprint(fingerprint),
			},
			Date.now() + 1000
		);

		expect(fingerprint).lengthOf(32);
		await publicFederatedToken.loadAccessJWT(signer, exampleJWT, fingerprint);

		const result = await signer.verifyJWT(exampleJWT);
		expect(publicFederatedToken.tokens).toStrictEqual(
			publicFederatedToken.decryptTokens(signer, result.payload.state as string)
		);
		expect(publicFederatedToken.values).toStrictEqual({
			value1: "exampleValue1",
			value2: "exampleValue2",
		});
	});

	test("createRefreshJWT", async () => {
		// Write tests for createRefreshJWT if needed
		const publicFederatedToken = new PublicFederatedToken();
		publicFederatedToken.refreshTokens = {
			value1: "exampleValue1",
		};

		const jwt = await publicFederatedToken.createRefreshJWT(signer);
		expect(jwt).toBeDefined();
	});
});
