import { CookieOptions, Request, Response } from "express";
import { TokenSource } from "./base.js";

type CookieSourceOptions = {
	secure: boolean;
	sameSite: CookieOptions["sameSite"];
	refreshTokenPath: string;
	publicDomainFn?: (request: Request) => string | undefined;
	privateDomainFn?: (request: Request) => string | undefined;
};

/*
 * CookieTokenSource is a TokenSource that uses cookies to store the tokens. It
 * uses the following four cookies for storing the token securely by mixing
 * httpOnly and non-httpOnly cookies:
 *  - accessToken: The access token (non-httpOnly)
 *  - refreshToken: The refresh token (httpOnly)
 *  - refreshTokenExist: A flag to indicate that the refresh token exists (non-httpOnly)
 *  - accessTokenFingerprint: The fingerprint of the browser (httpOnly)
 */
export class CookieTokenSource implements TokenSource {
	constructor(private options: CookieSourceOptions) {}

	cookieNames = {
		accessToken: "authToken",
		accessTokenHash: "authTokenHash",
		refreshToken: "authRefreshToken",
		refreshTokenExist: "authRefreshTokenExist",
	};

	_getCookieName(name: string): string {
		if (this.options.secure && this.options.sameSite === "strict")
			return `__Host-${name}`;
		return `${name}`;
	}

	_getCookie(request: Request, name: string) {
		return request.cookies[this._getCookieName(name)];
	}

	_setCookie(
		response: Response,
		name: string,
		value: string,
		options: CookieOptions
	) {
		response.cookie(this._getCookieName(name), value, options);
	}

	getAccessToken(request: Request): string {
		return this._getCookie(request, this.cookieNames.accessToken);
	}

	getRefreshToken(request: Request): string {
		return this._getCookie(request, this.cookieNames.refreshToken);
	}

	getFingerprint(request: Request): string {
		return this._getCookie(request, this.cookieNames.accessTokenHash);
	}

	setAccessToken(request: Request, response: Response, token: string) {
		this._setCookie(response, this.cookieNames.accessToken, token, {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.options?.publicDomainFn?.(request),
		});
	}

	setRefreshToken(request: Request, response: Response, token: string) {
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
		this._setCookie(response, this.cookieNames.refreshToken, token, {
			httpOnly: true,
			path: this.options.refreshTokenPath,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			expires: expiresAt,
			domain: this.options?.privateDomainFn?.(request),
		});

		this._setCookie(response, this.cookieNames.refreshTokenExist, "1", {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			expires: expiresAt,
			domain: this.options?.publicDomainFn?.(request),
		});
	}

	setFingerprint(request: Request, response: Response, fingerprint: string) {
		this._setCookie(response, this.cookieNames.accessTokenHash, fingerprint, {
			httpOnly: true,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.options?.privateDomainFn?.(request),
		});
	}
}
