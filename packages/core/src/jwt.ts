import { TokenExpiredError, TokenInvalidError } from "./errors";
import type { TokenSigner } from "./sign";
import { type AccessToken, FederatedToken } from "./token";

type JWTPayload = {
	exp: number;
	jwe: string;
	_fingerprint: string;
	tokens: Record<string, AccessToken>;
	isAuthenticated?: boolean;
	[key: string]: unknown;
};

export class PublicFederatedToken extends FederatedToken {
	// Create the access JWT. This JWT is sent to the client. It is sent as
	// signed token (not encrypted). The jwe attribute is encrypted, however.
	// This is all done when the GraphQL gateway sends the response back to the
	// client.

	// Create the JWT for the client, this JWT is only signed and used to store
	// JWT values
	async createDataJWT(
		signer: TokenSigner,
		{ exp }: { exp?: number } = {},
	): Promise<string | undefined> {
		if (!this.values) {
			return;
		}

		const payload = {
			values: this.values,
			exp: exp ?? this.getDataExpireTime(),
			sub: signer.getSubject(this),
		};

		return await signer.signJWT(payload);
	}

	// Clients read the session expiry from the data token, so it ends with the
	// first access token. Without an access token there is nothing to follow.
	private getDataExpireTime(): number {
		if (Object.keys(this.tokens).length > 0) {
			return this.getExpireTime();
		}
		return Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90;
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

	/**
	 * With `allowExpired`, an expired but otherwise valid data token still
	 * loads its values, marked modified so the gateway re-signs it. jose
	 * reports expiry only after verifying the signature, issuer and audience.
	 */
	async loadDataJWT(
		signer: TokenSigner,
		value: string,
		{ allowExpired = false }: { allowExpired?: boolean } = {},
	) {
		let payload: Record<string, unknown>;
		try {
			const result = await signer.verifyJWT(value);
			if (!result) {
				throw new TokenInvalidError("Invalid JWT");
			}
			payload = result.payload;
		} catch (e: unknown) {
			if (!(allowExpired && e instanceof TokenExpiredError && e.payload)) {
				throw e;
			}
			payload = e.payload;
			this._valueModified = true;
		}

		this.values = (payload.values ?? {}) as Record<string, unknown>;
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
