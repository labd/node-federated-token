import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TokenSigner } from "./sign";

describe("Strings", async () => {
	const signOptions = {
		encryptKey: "jabja buqb uibafjb jdbuieqb ajfbajfsa",
		signKey: "alsdlasdasd",
		audience: "exampleAudience",
		issuer: "exampleIssuer",
	};
	const signer = new TokenSigner(signOptions);

	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(Date.now())
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	test("encryptString", () => {
		const encryptedData = signer.encryptString("exampleString");
		expect(encryptedData.kid).toBe("1");
		expect(encryptedData.data).toBeDefined();

		const decryptedData = signer.decryptString(encryptedData);
		expect(decryptedData).toBe("exampleString");
	});

	test("JWT Sign and verify", async () => {
		const payload = {
			foo: "bar",
		};

		const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 90)
		const token = await signer.signJWT(payload, exp);
		expect(token).toBeDefined();

		const result = await signer.verifyJWT(token);
		expect(result).toBeDefined();
		expect(result.payload).toStrictEqual({
			aud: "exampleAudience",
			exp: exp,
			foo: "bar",
			iat: Math.floor(Date.now() / 1000),
			iss: "exampleIssuer",
		});
	});

	test("JWT Encrypt and Decrypt", async () => {
		const payload = {
			foo: "bar",
		};

		const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 90)
		const token = await signer.encryptJWT(payload, exp);
		expect(token).toBeDefined();

		const result = await signer.decryptJWT(token);
		expect(result).toBeDefined();
		expect(result.payload).toStrictEqual({
			aud: "exampleAudience",
			exp: exp,
			foo: "bar",
			iat: Math.floor(Date.now() / 1000),
			iss: "exampleIssuer",
		});
	})
});
