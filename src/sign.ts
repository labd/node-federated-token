import CryptoJS from "crypto-js";
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

export type EncryptedString = {
	kid: string;
	data: string;
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

	encryptString(value: string): EncryptedString {
		const key = jose.base64url.encode(this._encryptKey);
		const data = CryptoJS.AES.encrypt(value, key).toString();
		return {
			data: data,
			kid: "1",
		};
	}

	decryptString(value: EncryptedString) {
		const keyValue = this.getEncryptKeyById(value.kid);
		const key = jose.base64url.encode(keyValue);
		return CryptoJS.AES.decrypt(value.data, key).toString(CryptoJS.enc.Utf8);
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

	// For refresh token
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
		return this.getEncryptKeyById("1");
	}

	private getEncryptKeyById(keyId: string) {
		return this._encryptKey;
	}
}
