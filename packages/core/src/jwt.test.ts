import * as crypto from "node:crypto";
import { assert, describe, expect, onTestFinished, test, vi } from "vitest";
import { TokenExpiredError, TokenInvalidError } from "./errors";
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
		vi.useFakeTimers({ toFake: ["Date"] });
		onTestFinished(() => {
			vi.useRealTimers();
		});
		const now = Math.floor(Date.now() / 1000);
		const token = new PublicFederatedToken();
		token.values = {
			value1: "exampleValue1",
			value2: "exampleValue2",
		};
		const claims = {
			values: token.values,
			iat: now,
			aud: signOptions.audience,
			iss: signOptions.issuer,
		};

		const withoutAccessToken = await token.createDataJWT(signer);
		assert(withoutAccessToken);
		expect((await signer.verifyJWT(withoutAccessToken)).payload).toStrictEqual({
			...claims,
			exp: now + 60 * 60 * 24 * 90,
		});

		token.setAccessToken("late", { token: "a", exp: now + 120, sub: "s" });
		token.setAccessToken("early", { token: "b", exp: now + 60, sub: "s" });
		const withAccessTokens = await token.createDataJWT(signer);
		assert(withAccessTokens);
		expect((await signer.verifyJWT(withAccessTokens)).payload).toStrictEqual({
			...claims,
			exp: now + 60,
		});
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

	describe("loadDataJWT with an expired token", async () => {
		const values = { value1: "exampleValue1" };
		const expired = await signer.signJWT({
			values,
			exp: Math.floor(Date.now() / 1000) - 60,
		});

		test("throws TokenExpiredError by default", async () => {
			const token = new PublicFederatedToken();
			await expect(token.loadDataJWT(signer, expired)).rejects.toBeInstanceOf(
				TokenExpiredError,
			);
			expect(token.values).toStrictEqual({});
		});

		test("loads the values and marks them modified with allowExpired", async () => {
			const token = new PublicFederatedToken();
			await token.loadDataJWT(signer, expired, { allowExpired: true });
			expect(token.values).toStrictEqual(values);
			expect(token.isValueModified()).toBe(true);
		});

		test("rejects a forged expired token with allowExpired", async () => {
			const forger = new TokenSigner({
				...signOptions,
				signKeys: new KeyManager([
					{
						id: "1",
						key: crypto.createSecretKey(Buffer.from("forgedky".repeat(4))),
					},
				]),
			});
			const forged = await forger.signJWT({
				values,
				exp: Math.floor(Date.now() / 1000) - 60,
			});

			const token = new PublicFederatedToken();
			await expect(
				token.loadDataJWT(signer, forged, { allowExpired: true }),
			).rejects.toBeInstanceOf(TokenInvalidError);
			expect(token.values).toStrictEqual({});
		});
	});
});
