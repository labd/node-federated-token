import { type BaseContext } from "@apollo/server";
import { type Request, type Response } from "express";
import {
	generateFingerprint,
	hashFingerprint,
	validateFingerprint,
} from "./fingerprint.js";
import { TokenSigner } from "./sign.js";
import { FederatedToken } from "./token.js";

export type PublicFederatedTokenContext = {
	federatedToken?: PublicFederatedToken;
	res: Response;
	req: Request;
} & BaseContext;

type JWTPayload = {
	exp: number;
	jwe: string;
	_fingerprint: string;
	[key: string]: any;
};

export class TokenExpiredError extends Error {}

export class TokenInvalidError extends Error {}

export class PublicFederatedToken extends FederatedToken {
	// Create the access JWT. This JWT is send to the client. It is send as
	// signed token (not encrypted). The jwe attribute is encrypted however.
	// This is all done when the GraphQL gateway sends the response back to the
	// client.
	async createAccessJWT(signer: TokenSigner) {
		const exp = this.getExpireTime();
		const fingerprint = generateFingerprint();

		const payload: JWTPayload = {
			...this.values,
			exp,
			sub: signer.getSubject(this),
			jwe: await signer.encryptObject(this.tokens),
			_fingerprint: hashFingerprint(fingerprint),
		};

		const token = await signer.signJWT(payload);
		return {
			accessToken: token,
			fingerprint: fingerprint,
		};
	}

	async loadAccessJWT(
		signer: TokenSigner,
		value: string,
		fingerprint?: string
	) {
		const result = await signer.verifyJWT(value);
		if (!result) {
			throw new Error("Invalid JWT");
		}

		const payload = result.payload as JWTPayload;
		if (!payload) {
			throw new TokenInvalidError("Invalid JWT");
		}

		// The expire time should be absolute, now margin for error. The client
		// should refresh the token X second before it expires.
		const unixTime = Math.floor(Date.now() / 1000);
		if (!payload.exp || payload.exp < unixTime) {
			throw new TokenExpiredError("JWT expired");
		}

		if (
			fingerprint &&
			!validateFingerprint(fingerprint, payload._fingerprint)
		) {
			throw new TokenInvalidError("Invalid fingerprint");
		}

		this.tokens = await signer.decryptObject(payload.jwe);
		const knownKeys = [
			"jwe",
			"iat",
			"exp",
			"aud",
			"sub",
			"jti",
			"iss",
			"_fingerprint",
		];
		for (const k in payload) {
			if (!knownKeys.includes(k)) {
				this.values[k] = payload[k];
			}
		}
	}

	// createRefreshJWT encrypts the refresh token and return a JWT. The token is
	// valid for 90 days.
	async createRefreshJWT(signer: TokenSigner) {
		const DAYS = 60 * 60 * 24;

		const exp = Math.floor(Date.now() / 1000) + 90 * DAYS;

		const payload = {
			...this.values,
			exp,
			sub: signer.getSubject(this),
			jwe: await signer.encryptObject(this.refreshTokens),
		};

		const token = await signer.encryptJWT(payload, exp);
		return token;
	}

	async loadRefreshJWT(signer: TokenSigner, value: string) {
		const result = await signer.decryptJWT(value);
		if (!result) {
			throw new Error("Invalid JWT");
		}

		const payload = result.payload as JWTPayload;
		if (!payload) {
			throw new TokenInvalidError("Invalid JWT");
		}

		// The expire time should be absolute, now margin for error. The client
		// should refresh the token X second before it expires.
		const unixTime = Math.floor(Date.now() / 1000);
		if (!payload.exp || payload.exp < unixTime) {
			throw new TokenExpiredError("JWT expired");
		}

		this.refreshTokens = await signer.decryptObject(payload.jwe);
		const knownKeys = ["jwe", "iat", "exp", "aud", "iss"];
		for (const k in payload) {
			if (!knownKeys.includes(k)) {
				this.values[k] = payload[k];
			}
		}
	}
}
