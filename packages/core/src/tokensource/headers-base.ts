import type { TokenSource } from "./base";

export type HeaderNames = {
	accessToken: string;
	dataToken: string;
	refreshToken: string;
};

export interface HeaderAdapter<TRequest, TResponse> {
	getHeader(request: TRequest, name: string): string | undefined;
	setHeader(response: TResponse, name: string, value: string): void;
}

export type BaseHeaderSourceOptions = {
	headerNames?: Partial<HeaderNames>;
};

const DEFAULT_HEADER_NAMES: HeaderNames = {
	accessToken: "x-access-token",
	dataToken: "x-data-token",
	refreshToken: "x-refresh-token",
};

export abstract class BaseHeaderTokenSource<TRequest, TResponse>
	implements TokenSource<TRequest, TResponse>
{
	protected abstract adapter: HeaderAdapter<TRequest, TResponse>;
	protected headerNames: HeaderNames;

	constructor(options?: BaseHeaderSourceOptions) {
		this.headerNames = {
			...DEFAULT_HEADER_NAMES,
			...(options?.headerNames ?? {}),
		};
	}

	// Headers are stateless, so delete operations are no-ops
	deleteAccessToken(request: TRequest, response: TResponse): void {}
	deleteRefreshToken(request: TRequest, response: TResponse): void {}
	deleteDataToken(request: TRequest, response: TResponse): void {}

	getAccessToken(request: TRequest): string | undefined {
		const authHeader = this.adapter.getHeader(
			request,
			this.headerNames.accessToken,
		);
		return authHeader?.replace("Bearer ", "");
	}

	getRefreshToken(request: TRequest): string | undefined {
		return this.adapter.getHeader(request, this.headerNames.refreshToken);
	}

	getDataToken(request: TRequest): string | undefined {
		return this.adapter.getHeader(request, this.headerNames.dataToken);
	}

	setAccessToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	): void {
		this.adapter.setHeader(response, this.headerNames.accessToken, token);
	}

	setRefreshToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	): void {
		this.adapter.setHeader(response, this.headerNames.refreshToken, token);
	}

	setDataToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	): void {
		this.adapter.setHeader(response, this.headerNames.dataToken, token);
	}
}
