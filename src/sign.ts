import * as jose from "jose";

type TokenSignerOptions = {
	encryptKeys: KeyManagerInterface;
	signKeys: KeyManagerInterface;
	audience: string;
	issuer: string;
};

export class ConfigurationError extends Error {}

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
		const result = await jose.compactDecrypt(
			value,
			this._encryptKeys.getKeyFunction.bind(this._encryptKeys),
			{
				keyManagementAlgorithms: ["dir"],
				contentEncryptionAlgorithms: ["A256GCM"],
			}
		);
		return JSON.parse(result.plaintext.toString());
	}

	async signJWT(payload: any, exp: number) {
		const { id, key } = await this._signKeys.getActiveKey();
		return await new jose.SignJWT(payload)
			.setExpirationTime(exp)
			.setIssuedAt()
			.setProtectedHeader({ alg: "HS256", kid: id })
			.setAudience(this.config.audience)
			.setIssuer(this.config.issuer)
			.sign(key);
	}

	async verifyJWT(value: string) {
		return await jose.jwtVerify(
			value,
			this._signKeys.getKeyFunction.bind(this._signKeys),
			{
				algorithms: ["HS256"],
				audience: this.config.audience,
				issuer: this.config.issuer,
			}
		);
	}

	// For refresh token, encrypt the token (JWE)
	async encryptJWT(payload: any, exp: number) {
		const { id, key } = await this._encryptKeys.getActiveKey();

		const data = await new jose.EncryptJWT(payload)
			.setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256", kid: id })
			.setIssuedAt()
			.setIssuer(this.config.issuer)
			.setAudience(this.config.audience)
			.setExpirationTime(exp)
			.encrypt(key);
		return data;
	}

	async decryptJWT(jwt: string) {
		return await jose.jwtDecrypt(
			jwt,
			this._encryptKeys.getKeyFunction.bind(this._encryptKeys),
			{
				audience: this.config.audience,
				issuer: this.config.issuer,
			}
		);
	}
}

type Key = {
	id: string;
	key: jose.KeyLike;
};

export interface KeyManagerInterface {
	getActiveKey(): Promise<Key>;
	getKeyFunction(
		header: jose.JWTHeaderParameters | jose.CompactJWEHeaderParameters,
		input: jose.FlattenedJWSInput | jose.FlattenedJWE
	): Uint8Array | jose.KeyLike | Promise<Uint8Array | jose.KeyLike>;
}

export class KeyManager implements KeyManagerInterface {
	private keys: Key[];
	constructor(keys: Key[]) {
		if (keys.length === 0) {
			throw new ConfigurationError("Missing keys");
		}
		this.keys = keys;
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
		input: jose.FlattenedJWSInput | jose.FlattenedJWE
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
}
