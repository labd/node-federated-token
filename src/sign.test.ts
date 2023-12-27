import * as crypto from "crypto";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { KeyManager, TokenSigner } from "./sign.js";

describe("Strings", async () => {
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

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(Date.now());
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test("encryptObject", async () => {
		const value = {
			foo: ["bar", "baz", "qux"],
		};
		const encryptedData = await signer.encryptObject(value);
		const decryptedData = await signer.decryptObject(encryptedData);
		expect(decryptedData).toStrictEqual(value);
	});

	test("JWT Sign and verify", async () => {
		const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
		const payload = {
			foo: "bar",
			exp: exp,
		};

		const token = await signer.signJWT(payload);
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

		const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
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
	});
});
