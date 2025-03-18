import type { Request, Response } from "express";
import type { TokenSource } from "./base";

export class CompositeTokenSource<TRequest = Request, TResponse = Response>
	implements TokenSource<TRequest, TResponse>
{
	private sources: TokenSource<TRequest, TResponse>[];

	constructor(sources: TokenSource<TRequest, TResponse>[]) {
		this.sources = sources;
	}

	deleteAccessToken(request: TRequest, response: TResponse): void {
		for (const source of this.sources) {
			source.deleteAccessToken(request, response);
		}
	}

	deleteRefreshToken(request: TRequest, response: TResponse): void {
		for (const source of this.sources) {
			source.deleteRefreshToken(request, response);
		}
	}

	getAccessToken(request: TRequest): string {
		for (const source of this.sources) {
			const token = source.getAccessToken(request);
			if (token) {
				return token;
			}
		}
		return "";
	}

	getRefreshToken(request: TRequest): string {
		for (const source of this.sources) {
			const token = source.getRefreshToken(request);
			if (token) {
				return token;
			}
		}
		return "";
	}

	getDataToken(request: TRequest): string {
		for (const source of this.sources) {
			const token = source.getDataToken(request);
			if (token) {
				return token;
			}
		}
		return "";
	}

	setAccessToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	) {
		for (const source of this.sources) {
			source.setAccessToken(request, response, token, isAuthenticated);
		}
	}

	setRefreshToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	) {
		for (const source of this.sources) {
			source.setRefreshToken(request, response, token, isAuthenticated);
		}
	}

	setDataToken(
		request: TRequest,
		response: TResponse,
		token: string,
		isAuthenticated = false,
	) {
		for (const source of this.sources) {
			source.setDataToken(request, response, token, isAuthenticated);
		}
	}

	deleteDataToken(request: TRequest, response: TResponse): void {
		for (const source of this.sources) {
			source.deleteDataToken(request, response);
		}
	}
}
