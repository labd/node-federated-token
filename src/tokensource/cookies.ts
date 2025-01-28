import { CookieOptions, Request, Response } from "express";
import { TokenSource } from "./base";

type CookieNames = {
	accessToken: string;
	accessTokenHash: string;
	refreshToken: string;
	refreshTokenExist: string;
};

type CookieSourceOptions = {
	secure: boolean;
	sameSite: CookieOptions["sameSite"];
	refreshTokenPath: string | ((request: Request) => string | undefined);
	cookieNames?: CookieNames;
	publicDomainFn?: (request: Request) => string | undefined;
	privateDomainFn?: (request: Request) => string | undefined;
	cookiePathFn?: (request: Request) => string | undefined;
};

const DEFAULT_COOKIE_NAMES: CookieNames = {
	accessToken: "authToken",
	accessTokenHash: "authTokenHash",
	refreshToken: "authRefreshToken",
	refreshTokenExist: "authRefreshTokenExist",
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
	private cookieNames: {
		accessToken: string;
		accessTokenHash: string;
		refreshToken: string;
		refreshTokenExist: string;
	};

	constructor(private options: CookieSourceOptions) {
		this.cookieNames = {
			...(options.cookieNames ?? DEFAULT_COOKIE_NAMES),
		};

		// If the secure option is set, we need to set the __Host- prefix for the
		// fingerprint cookie. The refresh token cookie is
		if (options.secure) {
			this.cookieNames.accessTokenHash = `__Host-${this.cookieNames.accessTokenHash}`;
		}
	}

	deleteAccessToken(response: Response<any, Record<string, any>>): void {
		response.clearCookie(this.cookieNames.accessToken, {
			domain: this.options?.publicDomainFn?.(response.req),
			path: this.options?.cookiePathFn?.(response.req),
		});
		response.clearCookie(this.cookieNames.accessTokenHash, {
			domain: this.options?.privateDomainFn?.(response.req),
			path: this.options?.cookiePathFn?.(response.req),
		});
	}

	deleteRefreshToken(response: Response<any, Record<string, any>>): void {
		response.clearCookie(this.cookieNames.refreshToken, {
			path: this._getRefreshTokenPath(response.req),
			domain: this.options?.privateDomainFn?.(response.req),
		});
		response.clearCookie(this.cookieNames.refreshTokenExist, {
			domain: this.options?.publicDomainFn?.(response.req),
			path: this.options?.cookiePathFn?.(response.req),
		});
	}

	getAccessToken(request: Request): string {
		return request.cookies[this.cookieNames.accessToken];
	}

	getRefreshToken(request: Request): string {
		return request.cookies[this.cookieNames.refreshToken];
	}

	getFingerprint(request: Request): string {
		return request.cookies[this.cookieNames.accessTokenHash];
	}

	setAccessToken(request: Request, response: Response, token: string) {
		response.cookie(this.cookieNames.accessToken, token, {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.options?.publicDomainFn?.(request),
			path: this.options?.cookiePathFn?.(request),
		});
	}

	setRefreshToken(request: Request, response: Response, token: string) {
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);

		// The refresh token is set as a httpOnly cookie, only accessible by the
		// server. We can't set the __Host- prefix here because the refresh token
		// cookie has a different path.
		response.cookie(this.cookieNames.refreshToken, token, {
			httpOnly: true,
			path: this._getRefreshTokenPath(request),
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			expires: expiresAt,
			domain: this.options?.privateDomainFn?.(request),
		});

		// The refresh token exist flag is set as a non-httpOnly cookie, accessible
		// by the client. This is used to check if the refresh token exists.
		response.cookie(this.cookieNames.refreshTokenExist, "1", {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			expires: expiresAt,
			domain: this.options?.publicDomainFn?.(request),
			path: this.options?.cookiePathFn?.(request),
		});
	}

	// The fingerprint cookie is used to validate the access token. It is set as a
	// httpOnly cookie, only accessible by the server.
	setFingerprint(request: Request, response: Response, fingerprint: string) {
		response.cookie(this.cookieNames.accessTokenHash, fingerprint, {
			httpOnly: true,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.options?.privateDomainFn?.(request),
			path: this.options?.cookiePathFn?.(request),
		});
	}

	private _getRefreshTokenPath(req: Request): string | undefined {
		const path = this.options.refreshTokenPath;
		return typeof path === "function" ? path(req) : path;
	}
}
