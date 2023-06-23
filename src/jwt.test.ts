import * as jose from "jose";
import { assert, describe, test } from "vitest";
import { PublicFederatedToken, TokenSigner } from "./jwt";

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
		assert.deepStrictEqual(decryptedData, expectedData);
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

		assert.deepStrictEqual(decryptedData, expectedData);
	});

	test("createAccessJWT", async () => {
		const publicFederatedToken = new PublicFederatedToken();
		const expireAt = Date.now() + 1000;
		publicFederatedToken.tokens = {
			exampleName: {
				token: "exampleToken",
				exp: expireAt,
			},
		};
		publicFederatedToken.values = {
			value1: "exampleValue1",
			value2: "exampleValue2",
		};

		const jwt = await publicFederatedToken.createAccessJWT(signer);

		const result = await jose.jwtVerify(jwt, jose.base64url.decode(signOptions.signKey), {
			algorithms: ["HS256"],
			audience: signOptions.audience,
			issuer: signOptions.issuer,
		});
		const payload = result.payload;
		assert.deepStrictEqual(payload.exp, expireAt);
		assert.deepStrictEqual(payload.value1, "exampleValue1");
		assert.deepStrictEqual(payload.value2, "exampleValue2");

		const decrypted = publicFederatedToken.decryptTokens(
			signer,
			payload.state as string
		);
		assert.deepStrictEqual(decrypted, publicFederatedToken.tokens);
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
		assert.deepStrictEqual(
			publicFederatedToken.tokens,
			publicFederatedToken.decryptTokens(signer, result.payload.state as string)
		);
		assert.deepStrictEqual(
			publicFederatedToken.values,
			{
				value1: "exampleValue1",
				value2: "exampleValue2",
			},
			"Values should be loaded correctly"
		);
	});

	test("createRefreshJWT", async () => {
		// Write tests for createRefreshJWT if needed
		const publicFederatedToken = new PublicFederatedToken();
		publicFederatedToken.refreshTokens = {
			value1: "exampleValue1",
		}

		const jwt = await publicFederatedToken.createRefreshJWT(signer);
	});
});
