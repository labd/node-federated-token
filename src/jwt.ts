import CryptoJS from "crypto-js";
import * as jose from "jose";
import { FederatedToken } from "./token";

export type PublicFederatedTokenContext = {
	federatedToken?: PublicFederatedToken;
};

type TokenSignerOptions = {
	encryptKey: string;
	signKey: string;
	audience: string;
	issuer: string;
};

const padUint8Array = (
	array: Uint8Array,
	desiredLength: number
): Uint8Array => {
	if (array.length >= desiredLength) {
		return array;
	}

	const paddedArray = new Uint8Array(desiredLength);
	paddedArray.set(array, desiredLength - array.length);
	return paddedArray;
};

export class TokenSigner {
	private _encryptKey: Uint8Array;
	private _signKey: Uint8Array;

	constructor(private config: TokenSignerOptions) {
		if (!config.encryptKey) {
			throw new Error("Missing encryptKey");
		}
		if (!config.signKey) {
			throw new Error("Missing signKey");
		}
		if (!config.audience) {
			throw new Error("Missing audience");
		}
		if (!config.issuer) {
			throw new Error("Missing issuer");
		}

		this._encryptKey = padUint8Array(
			jose.base64url.decode(config.encryptKey),
			32
		);
		if (this._encryptKey.length != 32) {
			throw new Error("Invalid encryptKey length");
		}
		this._signKey = jose.base64url.decode(config.signKey);
	}

	encryptString(value: string) {
		const key = jose.base64url.encode(this._encryptKey);
		return CryptoJS.AES.encrypt(value, key).toString();
	}

	decryptString(value: string) {
		const key = jose.base64url.encode(this._encryptKey);
		return CryptoJS.AES.decrypt(value, key).toString(CryptoJS.enc.Utf8);
	}

	async signJWT(payload: any, exp: number) {
		return await new jose.SignJWT(payload)
			.setExpirationTime(exp)
			.setIssuedAt()
			.setProtectedHeader({ alg: "HS256" })
			.setAudience(this.config.audience)
			.setIssuer(this.config.issuer)
			.sign(this._signKey);
	}

	async verifyJWT(value: string) {
		return await jose.jwtVerify(value, this._signKey, {
			algorithms: ["HS256"],
			audience: this.config.audience,
			issuer: this.config.issuer,
		});
	}

	// For refresh token
	async encryptJWT(payload: any, exp: number) {
		const data = await new jose.EncryptJWT(payload)
			.setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256" })
			.setIssuedAt()
			.setIssuer(this.config.issuer)
			.setAudience(this.config.audience)
			.setExpirationTime(exp)
			.encrypt(this._encryptKey);
		return data;
	}

	async decryptJWT(jwt: string) {
		return await jose.jwtDecrypt(jwt, this._encryptKey, {
			audience: this.config.audience,
			issuer: this.config.issuer,
		});
	}
}

export class PublicFederatedToken extends FederatedToken {
	async createAccessJWT(signer: TokenSigner) {
		// Find the expire time of the first token that expires
		const values = Object.values(this.tokens);
		const sorted = values.sort((a, b) => a.exp - b.exp);
		const exp = sorted[0].exp;

		const payload = {
			exp: exp,
			state: this.encryptTokens(signer),
			...this.values,
		};

		return signer.signJWT(payload, exp);
	}

	async loadAccessJWT(signer: TokenSigner, value: string) {
		const result = await signer.verifyJWT(value);
		if (!result) {
			throw new Error("Invalid JWT");
		}

		const payload = result.payload;
		this.tokens = this.decryptTokens(signer, payload.state as string);
		const knownKeys = ["state", "iat", "exp", "aud", "iss"];
		for (const k in payload) {
			if (!knownKeys.includes(k)) {
				this.values[k] = payload[k];
			}
		}
	}

	async createRefreshJWT(signer: TokenSigner) {
		// Find the expire time of the first token that expires
		const payload = this.refreshTokens;
		const exp = Date.now() + 1000 * 60 * 60 * 24 * 90; // 30 days
		return signer.encryptJWT(payload, exp);
	}

	async loadRefreshJWT(signer: TokenSigner, value: string) {
		const result = await signer.decryptJWT(value);
		if (!result) {
			throw new Error("Invalid JWT");
		}

		const payload = result.payload;
		const knownKeys = ["state", "iat", "exp", "aud", "iss"];
		for (const k in payload) {
			if (!knownKeys.includes(k)) {
				this.refreshTokens[k] = payload[k] as string;
			}
		}
	}

	encryptTokens(signer: TokenSigner) {
		const value = JSON.stringify(this.tokens);
		return signer.encryptString(value);
	}

	decryptTokens(signer: TokenSigner, value: string) {
		const data = signer.decryptString(value);
		return JSON.parse(data);
	}
}
