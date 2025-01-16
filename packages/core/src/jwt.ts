import { TokenExpiredError, TokenInvalidError } from "./errors";
import type { TokenSigner } from "./sign";
import { FederatedToken } from "./token";

type JWTPayload = {
	exp: number;
	jwe: string;
	_fingerprint: string;
	[key: string]: any;
};

export class PublicFederatedToken extends FederatedToken {
	// Create the access JWT. This JWT is sent to the client. It is sent as
	// signed token (not encrypted). The jwe attribute is encrypted, however.
	// This is all done when the GraphQL gateway sends the response back to the
	// client.

	// Create the JWT for the client, this JWT is only signed and used to store
	// JWT values
	async createDataJWT(signer: TokenSigner): Promise<string | undefined> {
		if (!this.values) {
			return;
		}

		const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
		const payload = {
			values: this.values,
			exp,
			sub: signer.getSubject(this),
		};

		return await signer.signJWT(payload);
	}

	// Create the access JWT. This JWT is sent to the client. Is used in the
	// userToken / guestToken and should be encrypted and HTTP_ONLY
	async createAccessJWT(signer: TokenSigner) {
		const exp = this.getExpireTime();
		const data = {
			tokens: this.tokens,
			isAuthenticated: this.isAuthenticated(),
		};
		return await signer.encryptJWT(data, exp);
	}

	async loadDataJWT(signer: TokenSigner, value: string) {
		const result = await signer.verifyJWT(value);
		if (!result) {
			throw new TokenInvalidError("Invalid JWT");
		}

		this.values = result.payload.values as Record<string, any>;
	}

	async loadAccessJWT(signer: TokenSigner, value: string) {
		const result = await signer.decryptJWT(value);
		if (!result) {
			throw new Error("Invalid JWT");
		}

		const payload = result.payload as JWTPayload;
		if (!payload) {
			throw new TokenInvalidError("Invalid JWT");
		}

		// The expiry time should be absolute, now margin for error. The client
		// should refresh the token X second before it expires.
		const unixTime = Math.floor(Date.now() / 1000);
		if (!payload.exp || payload.exp < unixTime) {
			throw new TokenExpiredError("JWT expired");
		}

		this.tokens = payload.tokens;
		if (payload.isAuthenticated) {
			this.setIsAuthenticated();
		} else {
			this.setIsAnonymous();
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
			throw new TokenInvalidError("Invalid JWT");
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
