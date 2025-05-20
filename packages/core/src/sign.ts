import { KeyObject } from "node:crypto";
import * as jose from "jose";
import { ConfigurationError, createError } from "./errors";
import type { PublicFederatedToken } from "./jwt";

type TokenSignerOptions = {
	encryptKeys: KeyManagerInterface;
	signKeys: KeyManagerInterface;
	audience: string;
	issuer: string;
	getSubject?: (token: PublicFederatedToken) => string;
};

export class TokenSigner {
	private _encryptKeys: KeyManagerInterface;
	private _signKeys: KeyManagerInterface;

	constructor(private config: TokenSignerOptions) {
		if (!config.audience) {
			throw new ConfigurationError("Missing audience");
		}
		if (!config.issuer) {
			throw new ConfigurationError("Missing issuer");
		}
		this._encryptKeys = config.encryptKeys;
		this._signKeys = config.signKeys;
	}

	// Encrypt the embedded token (JWE) in the JWT
	async encryptObject(value: Record<string, any>): Promise<string> {
		const { id, key } = await this._encryptKeys.getActiveKey();
		const buf = new TextEncoder().encode(JSON.stringify(value));
		const data = await new jose.CompactEncrypt(buf)
			.setProtectedHeader({ alg: "dir", enc: "A256GCM", kid: id })
			.encrypt(key);
		return data;
	}

	// Decrypt the embedded token (JWE) in the JWT
	async decryptObject(value: string) {
		if (typeof value !== "string") {
			throw new Error("Invalid value type");
		}
		try {
			const result = await jose.compactDecrypt(
				value,
				this._encryptKeys.getKeyFunction.bind(this._encryptKeys),
				{
					keyManagementAlgorithms: ["dir"],
					contentEncryptionAlgorithms: ["A256GCM"],
				},
			);
			const data = new TextDecoder().decode(result.plaintext);
			return JSON.parse(data);
		} catch (e) {
			throw createError(e);
		}
	}

	getSubject(token: PublicFederatedToken): string | undefined {
		return this.config.getSubject ? this.config.getSubject(token) : undefined;
	}

	async signJWT(payload: jose.JWTPayload) {
		const { id, key } = await this._signKeys.getActiveKey();

		return new jose.SignJWT(payload)
			.setIssuedAt()
			.setProtectedHeader({ alg: "HS256", kid: id })
			.setAudience(this.config.audience)
			.setIssuer(this.config.issuer)
			.sign(key);
	}

	async verifyJWT(value: string) {
		try {
			return await jose.jwtVerify(
				value,
				this._signKeys.getKeyFunction.bind(this._signKeys),
				{
					algorithms: ["HS256"],
					audience: this.config.audience,
					issuer: this.config.issuer,
				},
			);
		} catch (e) {
			throw createError(e);
		}
	}

	// For refresh token, encrypt the token (JWE)
	async encryptJWT(payload: jose.JWTPayload, exp: number) {
		const { id, key } = await this._encryptKeys.getActiveKey();

		const data = await new jose.EncryptJWT(payload)
			.setProtectedHeader({ alg: "dir", enc: "A256GCM", kid: id, exp: exp })
			.setIssuedAt()
			.setIssuer(this.config.issuer)
			.setAudience(this.config.audience)
			.setExpirationTime(exp)
			.encrypt(key);
		return data;
	}

	async decryptJWT(jwt: string) {
		try {
			return await jose.jwtDecrypt(
				jwt,
				this._encryptKeys.getKeyFunction.bind(this._encryptKeys),
				{
					audience: this.config.audience,
					issuer: this.config.issuer,
				},
			);
		} catch (e) {
			throw createError(e);
		}
	}
}

type Key = {
	id: string;
	key: jose.KeyLike | Uint8Array;
};

export interface KeyManagerInterface {
	getActiveKey(): Promise<Key>;
	getKeyFunction(
		header: jose.JWTHeaderParameters | jose.CompactJWEHeaderParameters,
		input: jose.FlattenedJWSInput | jose.FlattenedJWE,
	): Uint8Array | jose.KeyLike | Promise<Uint8Array | jose.KeyLike>;
}

export class KeyManager implements KeyManagerInterface {
	private keys: Key[];
	constructor(keys: Key[]) {
		if (keys.length === 0) {
			throw new ConfigurationError("Missing keys");
		}
		this.keys = keys.map((k) => ({ id: k.id, key: this.convertKey(k.key) }));
	}

	// getActiveKey returns a key to sign the JWT. It always returns the first key
	// in the list.
	async getActiveKey(): Promise<Key> {
		return this.keys[0];
	}

	// getKeyFunction is passed to the jose library to retrieve the key to verify
	// or decrypt the JWE.
	getKeyFunction(
		header: jose.JWTHeaderParameters | jose.CompactJWEHeaderParameters,
		input: jose.FlattenedJWSInput | jose.FlattenedJWE,
	): Uint8Array | jose.KeyLike | Promise<Uint8Array | jose.KeyLike> {
		const kid = header?.kid;
		if (!kid) {
			throw new ConfigurationError("Missing kid");
		}
		const key = this.keys.find((k) => k.id === kid)?.key;
		if (!key) {
			throw new ConfigurationError("Missing key");
		}
		return key;
	}

	convertKey(
		key: KeyObject | jose.KeyLike | Uint8Array,
	): Uint8Array | jose.KeyLike {
		if (key instanceof KeyObject) {
			return new Uint8Array(key.export());
		}
		return key;
	}
}
