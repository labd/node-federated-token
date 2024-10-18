import { CookieOptions, Request, Response } from "express";
import { TokenSource } from "./base";

type CookieNames = {
	// Anonymous cookies
	sessionData: string;
	sessionToken: string; // HTTP ONLY

	// Authenticated cookies
	userData: string;
	userToken: string; // HTTP_ONLY

	// refresh token cookies; note that we don't prefix the `refreshTokenExists`
	// with `session` for backwards compatibility.
	refreshTokenExist: string;
	refreshToken: string; // HTTP_ONLY
	userRefreshTokenExist: string;
};

type CookieSourceOptions = {
	secure: boolean;
	sameSite: CookieOptions["sameSite"];
	refreshTokenPath: string;
	cookieNames?: CookieNames;
	publicDomainFn?: (request: Request) => string | undefined;
	privateDomainFn?: (request: Request) => string | undefined;
};

const DEFAULT_COOKIE_NAMES: CookieNames = {
	userData: "userData",
	sessionData: "sessionData",
	userToken: "userToken",
	sessionToken: "sessionToken",

	userRefreshTokenExist: "userRefreshTokenExist",
	refreshToken: "authRefreshToken",
	refreshTokenExist: "authRefreshTokenExist",
};

/*
 * CookieTokenSource is a TokenSource that uses cookies to store the tokens. It
 * uses the cookies listen in `CookieNames` to store the tokens. The cookies are
 * set based on the options provided in `CookieSourceOptions`.
 */
export class CookieTokenSource implements TokenSource {
	private cookieNames: CookieNames;

	constructor(private options: CookieSourceOptions) {
		this.cookieNames = {
			...(options.cookieNames ?? DEFAULT_COOKIE_NAMES),
		};
	}

	deleteAccessToken(
		request: Request,
		response: Response<any, Record<string, any>>,
	): void {
		const names = [
			this.cookieNames.userToken,
			this.cookieNames.sessionToken,
			this.cookieNames.userData,
			this.cookieNames.sessionData,
		];

		for (const name of names) {
			this.deleteAccessTokenByName(response, name);
		}
	}

	deleteRefreshToken(
		request: Request,
		response: Response<any, Record<string, any>>,
	): void {
		response.clearCookie(this.cookieNames.refreshToken, {
			path: this.options.refreshTokenPath,
			domain: this.options?.privateDomainFn?.(response.req),
		});

		if (request.cookies[this.cookieNames.refreshTokenExist]) {
			response.clearCookie(this.cookieNames.refreshTokenExist, {
				domain: this.options?.publicDomainFn?.(response.req),
			});
		}
		if (request.cookies[this.cookieNames.userRefreshTokenExist]) {
			response.clearCookie(this.cookieNames.userRefreshTokenExist, {
				domain: this.options?.publicDomainFn?.(response.req),
			});
		}
	}

	deleteAccessTokenByName(
		response: Response<any, Record<string, any>>,
		name: string,
	): void {
		response.clearCookie(name, {
			domain: this.options?.publicDomainFn?.(response.req),
		});
	}

	deleteRefreshTokenByName(
		response: Response<any, Record<string, any>>,
		name: string,
	): void {
		response.clearCookie(name, {
			path: this.options.refreshTokenPath,
			domain: this.options?.publicDomainFn?.(response.req),
		});
	}

	getAccessToken(request: Request): string | undefined {
		const names = [this.cookieNames.userToken, this.cookieNames.sessionToken];
		for (const name of names) {
			if (request.cookies[name]) {
				return request.cookies[name];
			}
		}
	}

	getRefreshToken(request: Request): string | undefined {
		return request.cookies[this.cookieNames.refreshToken];
	}

	setDataToken(request: Request, response: Response) {}

	getDataToken(request: Request): string | undefined {
		return "";
	}

	setAccessToken(
		request: Request,
		response: Response,
		token: string,
		isAuthenticated = false,
	) {
		const cookieOptions = {
			httpOnly: true,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.options?.publicDomainFn?.(request),
		};

		if (isAuthenticated) {
			response.cookie(this.cookieNames.userToken, token, cookieOptions);

			// Clear old session token
			if (request.cookies[this.cookieNames.sessionToken]) {
				this.deleteAccessTokenByName(response, this.cookieNames.sessionToken);
			}
			return;
		} else {
			response.cookie(this.cookieNames.sessionToken, token, cookieOptions);

			// Clear old user token
			if (request.cookies[this.cookieNames.userToken]) {
				this.deleteAccessTokenByName(response, this.cookieNames.userToken);
			}
		}
	}

	/**
	 * Set the `refreshToken` and the `refreshTokenExist` cookies. The name for
	 * the `refreshTokenExist` cookie is determined by the `isAuthenticated` flag.
	 *
	 * @param request
	 * @param response
	 * @param token
	 * @param isAuthenticated
	 */
	setRefreshToken(
		request: Request,
		response: Response,
		token: string,
		isAuthenticated = false,
	) {
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
		const cookieOptions = {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			expires: expiresAt,
			domain: this.options?.publicDomainFn?.(request),
		};

		// The refresh token is set as a HTTP_ONLY cookie and is only accessible by
		// a specific path.
		response.cookie(this.cookieNames.refreshToken, token, {
			...cookieOptions,
			httpOnly: true,
			path: this.options.refreshTokenPath,
		});

		// The refresh token exist flag is set as a non-httpOnly cookie, accessible
		// by the client. This is used to check if the refresh token exists.
		if (isAuthenticated) {
			response.cookie(
				this.cookieNames.userRefreshTokenExist,
				"1",
				cookieOptions,
			);
		} else {
			response.cookie(this.cookieNames.refreshTokenExist, "1", cookieOptions);
		}
	}
}
