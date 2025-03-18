export interface TokenSource<TRequest, TResponse> {
	deleteAccessToken(request: TRequest, response: TResponse): void;
	deleteRefreshToken(request: TRequest, response: TResponse): void;
	deleteDataToken(request: TRequest, response: TResponse): void;

	getAccessToken(request: TRequest): string | undefined;
	getDataToken(request: TRequest): string | undefined;
	getRefreshToken(request: TRequest): string | undefined;

	setDataToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated?: boolean,
	): void;
	setAccessToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated?: boolean,
	): void;
	setRefreshToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated?: boolean,
	): void;
}
