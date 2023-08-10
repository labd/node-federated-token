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
	async createAccessJWT(signer: TokenSigner) {
		// Find the expire time of the first token that expires
		const values = Object.values(this.tokens);
		const sorted = values.sort((a, b) => a.exp - b.exp);
		const exp = sorted[0].exp;

		const fingerprint = generateFingerprint();
		const payload: JWTPayload = {
			exp: exp,
			jwe: await signer.encryptObject(this.tokens),
			...this.values,
			_fingerprint: hashFingerprint(fingerprint),
		};

		const token = await signer.signJWT(payload, exp);

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
		const knownKeys = ["jwe", "iat", "exp", "aud", "iss", "_fingerprint"];
		for (const k in payload) {
			if (!knownKeys.includes(k)) {
				this.values[k] = payload[k];
			}
		}
	}

	// createRefreshJWT encrypts the refresh token and return a JWT. The token is
	// valid for 90 days.
	async createRefreshJWT(signer: TokenSigner) {
		const payload = this.refreshTokens;
		const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
		return signer.encryptJWT(payload, exp);
	}

	async loadRefreshJWT(signer: TokenSigner, value: string) {
		const result = await signer.decryptJWT(value);
		if (!result) {
			throw new Error("Invalid JWT");
		}

		const payload = result.payload;
		const knownKeys = ["jwe", "iat", "exp", "aud", "iss"];
		for (const k in payload) {
			if (!knownKeys.includes(k)) {
				this.refreshTokens[k] = payload[k] as string;
			}
		}
	}
}
