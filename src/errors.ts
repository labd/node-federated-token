import * as jose from "jose";

export class TokenExpiredError extends Error {}

export class TokenInvalidError extends Error {}

export const createError = (e: unknown): Error => {
	if (e instanceof jose.errors.JWTClaimValidationFailed) {
		return new TokenExpiredError(e.message);
	}
	if (e instanceof jose.errors.JWTExpired) {
		return new TokenExpiredError(e.message);
	}
	if (e instanceof Error) {
		return new TokenInvalidError(e.message);
	}

	return new TokenInvalidError();
};
