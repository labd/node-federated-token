import CryptoJS from "crypto-js";
import * as jose from "jose";
import { FederatedToken } from "./token";
import { Response, Request } from "express";
import {
  generateFingerprint,
  hashFingerprint,
  validateFingerprint,
} from "./fingerprint";
import { CompactJWEHeaderParameters, FlattenedJWE, FlattenedJWSInput, JWTHeaderParameters } from "jose";

export type PublicFederatedTokenContext = {
  federatedToken?: PublicFederatedToken;
  res: Response;
  req: Request;
};

type TokenSignerOptions = {
  encryptKey: string;
  signKey: string;
  audience: string;
  issuer: string;
};

type JWTPayload = {
  exp: number;
  state: string;
  _fingerprint: string;
  [key: string]: any;
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

export class TokenExpiredError extends Error {}

export class ConfigurationError extends Error {}

export class TokenInvalidError extends Error {}

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

  encryptString(value: string) {
    const key = jose.base64url.encode(this._encryptKey);
    const data = CryptoJS.AES.encrypt(value, key).toString();
    return {
      data: data,
      kid: "1",
    }
  }

  decryptString(value: { data: string, kid: string}) {
    const keyValue = this.getEncryptKeyFunction({ kid: value.kid })
    const key = jose.base64url.encode(keyValue)
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

  private getSignKeyFunction(header: JWTHeaderParameters, input: FlattenedJWSInput) {
    return this._signKey;
  }

  private getEncryptKey() {
    return {
      keyId: "1",
      keyValue: this._encryptKey,
    };
  }

  private getEncryptKeyFunction(header: CompactJWEHeaderParameters, input: FlattenedJWE) {
    return this.getEncryptKeyById("1")
  }

  private getEncryptKeyById(keyId: string) {
    return this._encryptKey;
  }
}

export class PublicFederatedToken extends FederatedToken {
  async createAccessJWT(signer: TokenSigner) {
    // Find the expire time of the first token that expires
    const values = Object.values(this.tokens);
    const sorted = values.sort((a, b) => a.exp - b.exp);
    const exp = sorted[0].exp;

    const fingerprint = generateFingerprint();
    const payload: JWTPayload = {
      exp: exp,
      state: this.encryptTokens(signer),
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

    this.tokens = this.decryptTokens(signer, payload.state as string);
    const knownKeys = ["state", "iat", "exp", "aud", "iss", "_fingerprint"];
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
