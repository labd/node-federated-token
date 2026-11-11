import * as jose from "jose";

export class TokenExpiredError extends Error {
	/** The claims of a signed token, set only after its signature, issuer and audience verified. */
	readonly payload?: jose.JWTPayload;

	constructor(message?: string, payload?: jose.JWTPayload) {
		super(message);
		this.payload = payload;
	}
}

export class TokenInvalidError extends Error {}

export const createError = (e: unknown): Error => {
	if (e instanceof jose.errors.JWTExpired) {
		return new TokenExpiredError(e.message, e.payload);
	}
	if (e instanceof jose.errors.JWTClaimValidationFailed) {
		return new TokenInvalidError(e.message);
	}
	if (e instanceof Error) {
		return new TokenInvalidError(e.message);
	}

	return new TokenInvalidError();
};

export class ConfigurationError extends Error {}
