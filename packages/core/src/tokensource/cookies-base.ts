import type { TokenSource } from "./base";

export type CookieNames = {
	// Anonymous cookies
	guestData: string;
	guestToken: string; // HTTP ONLY

	// Authenticated cookies
	userData: string;
	userToken: string; // HTTP_ONLY

	// Refresh token cookies
	refreshToken: string; // HTTP_ONLY
	guestRefreshTokenExists: string;
	userRefreshTokenExists: string;
};

export interface CookieOptions {
	maxAge?: number | undefined;
	expires?: Date | undefined;
	httpOnly?: boolean | undefined;
	path?: string | undefined;
	domain?: string | undefined;
	secure?: boolean | undefined;
	sameSite?: boolean | "lax" | "strict" | "none" | undefined;
}

export interface CookieAdapter<TRequest, TResponse> {
	getCookie(request: TRequest, name: string): string | undefined;
	setCookie(
		request: TRequest,
		response: TResponse,
		name: string,
		value: string,
		options: CookieOptions,
	): void;
	clearCookie(
		request: TRequest,
		response: TResponse,
		name: string,
		options?: CookieOptions,
	): void;
	getPublicDomain(request: TRequest): string | undefined;
	getPrivateDomain(request: TRequest): string | undefined;
}

export const DEFAULT_COOKIE_NAMES: CookieNames = {
	userData: "userData",
	guestData: "guestData",
	userToken: "userToken",
	guestToken: "guestToken",

	refreshToken: "refreshToken",
	userRefreshTokenExists: "userRefreshTokenExists",
	guestRefreshTokenExists: "guestRefreshTokenExists",
};

export type BaseCookieSourceOptions = {
	secure: boolean;
	sameSite: "strict" | "lax" | "none" | boolean;
	refreshTokenPath: string;
	cookieNames?: Partial<CookieNames>;
};

export abstract class BaseCookieTokenSource<TRequest, TResponse>
	implements TokenSource<TRequest, TResponse>
{
	protected cookieNames: CookieNames;
	protected abstract adapter: CookieAdapter<TRequest, TResponse>;

	constructor(protected options: BaseCookieSourceOptions) {
		this.cookieNames = {
			...DEFAULT_COOKIE_NAMES,
			...(options.cookieNames ?? {}),
		};
	}

	deleteAccessToken(request: TRequest, response: TResponse): void {
		const names = [this.cookieNames.userToken, this.cookieNames.guestToken];

		for (const name of names) {
			this.deleteAccessTokenByName(request, response, name);
		}
	}

	deleteRefreshToken(request: TRequest, response: TResponse): void {
		this.adapter.clearCookie(request, response, this.cookieNames.refreshToken, {
			path: this.options.refreshTokenPath,
			domain: this.adapter.getPrivateDomain(request),
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

	deleteDataToken(request: TRequest, response: TResponse): void {
		const names = [this.cookieNames.userData, this.cookieNames.guestData];

		for (const name of names) {
			this.deleteAccessTokenByName(request, response, name);
		}
	}

	deleteAccessTokenByName(
		request: TRequest,
		response: TResponse,
		name: string,
	): void {
		if (this.adapter.getCookie(request, name)) {
			this.adapter.clearCookie(request, response, name, {
				domain: this.adapter.getPublicDomain(request),
			});
		}
	}

	deleteRefreshTokenExistsByName(
		request: TRequest,
		response: TResponse,
		name: string,
	): void {
		if (this.adapter.getCookie(request, name)) {
			this.adapter.clearCookie(request, response, name, {
				domain: this.adapter.getPublicDomain(request),
			});
		}
	}

	getAccessToken(request: TRequest): string | undefined {
		const names = [this.cookieNames.userToken, this.cookieNames.guestToken];
		for (const name of names) {
			const value = this.adapter.getCookie(request, name);
			if (value) {
				return value;
			}
		}
		return undefined;
	}

	getRefreshToken(request: TRequest): string | undefined {
		return this.adapter.getCookie(request, this.cookieNames.refreshToken);
	}

	setDataToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	) {
		const cookieOptions = {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.adapter.getPublicDomain(request),
			path: "/",
		};

		if (isAuthenticated) {
			this.adapter.setCookie(
				request,
				response,
				this.cookieNames.userData,
				token,
				cookieOptions,
			);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.guestData,
			);
		} else {
			this.adapter.setCookie(
				request,
				response,
				this.cookieNames.guestData,
				token,
				cookieOptions,
			);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.userData,
			);
		}
	}

	getDataToken(request: TRequest): string | undefined {
		const names = [this.cookieNames.userData, this.cookieNames.guestData];
		for (const name of names) {
			const value = this.adapter.getCookie(request, name);
			if (value) {
				return value;
			}
		}
		return undefined;
	}

	setAccessToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	) {
		const cookieOptions = {
			httpOnly: true,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			domain: this.adapter.getPublicDomain(request),
			path: "/",
		};

		if (isAuthenticated) {
			this.adapter.setCookie(
				request,
				response,
				this.cookieNames.userToken,
				token,
				cookieOptions,
			);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.guestToken,
			);
		} else {
			this.adapter.setCookie(
				request,
				response,
				this.cookieNames.guestToken,
				token,
				cookieOptions,
			);
			this.deleteAccessTokenByName(
				request,
				response,
				this.cookieNames.userToken,
			);
		}
	}

	setRefreshToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	) {
		const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
		const cookieOptions = {
			httpOnly: false,
			secure: this.options.secure,
			sameSite: this.options.sameSite,
			expires: expiresAt,
			domain: this.adapter.getPublicDomain(request),
		};

		this.adapter.setCookie(
			request,
			response,
			this.cookieNames.refreshToken,
			token,
			{
				...cookieOptions,
				httpOnly: true,
				path: this.options.refreshTokenPath,
			},
		);

		if (isAuthenticated) {
			this.adapter.setCookie(
				request,
				response,
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
			this.adapter.setCookie(
				request,
				response,
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
