import * as jose from "jose";
import {
	CompactJWEHeaderParameters,
	FlattenedJWE,
	FlattenedJWSInput,
	JWTHeaderParameters,
} from "jose";

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

export class ConfigurationError extends Error {}

export class TokenSigner {
	private _encryptKey: Uint8Array;
	private _signKey: Uint8Array;

	constructor(private config: TokenSignerOptions) {
		if (!config.encryptKey) {
			throw new ConfigurationError("Missing encryptKey");
		}
		if (!config.signKey) {
			throw new ConfigurationError("Missing signKey");
		}
		if (!config.audience) {
			throw new ConfigurationError("Missing audience");
		}
		if (!config.issuer) {
			throw new ConfigurationError("Missing issuer");
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

	async encryptObject(value: Record<string, any>): Promise<string> {
		const buf = new TextEncoder().encode(JSON.stringify(value))
		const data = await new jose.CompactEncrypt(buf)
			.setProtectedHeader({ alg: "dir", enc: "A256GCM", kid: "1" })
			.encrypt(this._encryptKey);
		return data;
	}

	async decryptObject(value: string) {
		if (typeof value !== "string") {
			throw new Error("Invalid value type");
		}
		const result = await jose.compactDecrypt(
			value,
			this.getEncryptKeyFunction.bind(this),
			{
				keyManagementAlgorithms: ["dir"],
				contentEncryptionAlgorithms: ["A256GCM"],
			}
		)
		return JSON.parse(result.plaintext.toString())
	}

	async signJWT(payload: any, exp: number) {
		const { keyId, keyValue } = this.getSignKey();
		return await new jose.SignJWT(payload)
			.setExpirationTime(exp)
			.setIssuedAt()
			.setProtectedHeader({ alg: "HS256", kid: keyId })
			.setAudience(this.config.audience)
			.setIssuer(this.config.issuer)
			.sign(keyValue);
	}

	async verifyJWT(value: string) {
		return await jose.jwtVerify(value, this.getSignKeyFunction.bind(this), {
			algorithms: ["HS256"],
			audience: this.config.audience,
			issuer: this.config.issuer,
		});
	}

	// For refresh token, encrypt the token (JWE)
	async encryptJWT(payload: any, exp: number) {
		const { keyId, keyValue } = this.getEncryptKey();

		const data = await new jose.EncryptJWT(payload)
			.setProtectedHeader({ alg: "dir", enc: "A128CBC-HS256", kid: keyId })
			.setIssuedAt()
			.setIssuer(this.config.issuer)
			.setAudience(this.config.audience)
			.setExpirationTime(exp)
			.encrypt(keyValue);
		return data;
	}

	async decryptJWT(jwt: string) {
		return await jose.jwtDecrypt(jwt, this.getEncryptKeyFunction.bind(this), {
			audience: this.config.audience,
			issuer: this.config.issuer,
		});
	}

	private getSignKey() {
		return {
			keyId: "1",
			keyValue: this._signKey,
		};
	}

	private getSignKeyFunction(
		header: JWTHeaderParameters,
		input: FlattenedJWSInput
	) {
		return this._signKey;
	}

	private getEncryptKey() {
		return {
			keyId: "1",
			keyValue: this._encryptKey,
		};
	}

	private getEncryptKeyFunction(
		header: CompactJWEHeaderParameters,
		input: FlattenedJWE
	) {
		const kid = input.header?.kid ?? "1";
		return this.getEncryptKeyById(kid);
	}

	private getEncryptKeyById(keyId: string) {
		return this._encryptKey;
	}
}
