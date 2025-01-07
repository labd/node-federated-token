import type { CookieOptions, Request, Response } from "express";
import type { TokenSource } from "./base";

type CookieNames = {
	// Anonymous cookies
	guestData: string;
	guestToken: string; // HTTP ONLY

	// Authenticated cookies
	userData: string;
	userToken: string; // HTTP_ONLY

	// Refresh token cookies. The exists cookies are used to allow client-side
	// code to check if there is a refresh token to get a new token
	refreshToken: string; // HTTP_ONLY
	guestRefreshTokenExists: string;
	userRefreshTokenExists: string;
};

type CookieSourceOptions = {
	secure: boolean;
	sameSite: CookieOptions["sameSite"];
	refreshTokenPath: string;
	cookieNames?: Partial<CookieNames>;
	publicDomainFn?: (request: Request) => string | undefined;
	privateDomainFn?: (request: Request) => string | undefined;
};

const DEFAULT_COOKIE_NAMES: CookieNames = {
	userData: "userData",
	guestData: "guestData",
	userToken: "userToken",
	guestToken: "guestToken",

	refreshToken: "refreshToken",
	userRefreshTokenExists: "userRefreshTokenExists",
	guestRefreshTokenExists: "guestRefreshTokenExists",
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
			...DEFAULT_COOKIE_NAMES,
			...(options.cookieNames ?? {}),
		};
	}

	deleteAccessToken(request: Request, response: Response): void {
		const names = [this.cookieNames.userToken, this.cookieNames.guestToken];

		for (const name of names) {
			this.deleteAccessTokenByName(request, response, name);
		}
	}

	deleteRefreshToken(request: Request, response: Response): void {
		response.clearCookie(this.cookieNames.refreshToken, {
			path: this.options.refreshTokenPath,
			domain: this.options?.privateDomainFn?.(response.req),
		});

		this.deleteRefreshTokenExistsByName(
			request,
			response,
			this.cookieNames.guestRefreshTokenExists,
		);
		this.deleteRefreshTokenExistsByName(
			request,
			response,
			this.cookieNames.userRefreshTokenExists,
		);
	}

	deleteDataToken(request: Request, response: Response): void {
		const names = [this.cookieNames.userData, this.cookieNames.guestData];

		for (const name of names) {
			this.deleteAccessTokenByName(request, response, name);
		}
	}

	deleteAccessTokenByName(
		request: Request,
		response: Response,
		name: string,
	): void {
		if (request.cookies[name]) {
			response.clearCookie(name, {
				domain: this.options?.publicDomainFn?.(response.req),
			});
		}
	}

	deleteRefreshTokenExistsByName(
		request: Request,
		response: Response,
		name: string,
	): void {
		if (request.cookies[name]) {
			response.clearCookie(name, {
				domain: this.options?.publicDomainFn?.(response.req),
			});
		}
	}

	getAccessToken(request: Request): string | undefined {
		const names = [this.cookieNames.userToken, this.cookieNames.guestToken];
		for (const name of names) {
			if (request.cookies[name]) {
				return request.cookies[name];
			}
		}
	}

	getRefreshToken(request: Request): string | undefined {
		return request.cookies[this.cookieNames.refreshToken];
	}

	setDataToken(
		request: Request,
		response: Response,
		token: string,
		isAuthenticated = false,
	) {
		const cookieOptions = {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.options?.publicDomainFn?.(request),
		};

		if (isAuthenticated) {
			response.cookie(this.cookieNames.userData, token, cookieOptions);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.guestData,
			);
		} else {
			response.cookie(this.cookieNames.guestData, token, cookieOptions);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.userData,
			);
		}
	}

	getDataToken(request: Request): string | undefined {
		const names = [this.cookieNames.userData, this.cookieNames.guestData];
		for (const name of names) {
			if (request.cookies[name]) {
				return request.cookies[name];
			}
		}
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
			// Set user token and clear old guest token
			response.cookie(this.cookieNames.userToken, token, cookieOptions);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.guestToken,
			);
		} else {
			// Set guest token and clear old user token
			response.cookie(this.cookieNames.guestToken, token, cookieOptions);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.userToken,
			);
		}
	}

	/**
	 * Set the `refreshToken` and the `guestRefreshTokenExists` cookies. The name for
	 * the `guestRefreshTokenExists` cookie is determined by the `isAuthenticated` flag.
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
				this.cookieNames.userRefreshTokenExists,
				"1",
				cookieOptions,
			);
			this.deleteRefreshTokenExistsByName(
				request,
				response,
				this.cookieNames.guestRefreshTokenExists,
			);
		} else {
			response.cookie(
				this.cookieNames.guestRefreshTokenExists,
				"1",
				cookieOptions,
			);
			this.deleteRefreshTokenExistsByName(
				request,
				response,
				this.cookieNames.userRefreshTokenExists,
			);
		}
	}
}
