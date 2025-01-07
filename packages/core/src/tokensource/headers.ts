import type { Request, Response } from "express";
import type { TokenSource } from "./base";

export class HeaderTokenSource implements TokenSource {
	headerNames = {
		accessToken: "x-access-token",
		dataToken: "x-data-token",
		refreshToken: "x-refresh-token",
	};

	deleteAccessToken(
		request: Request,
		response: Response<any, Record<string, any>>,
	): void {}

	deleteRefreshToken(
		request: Request,
		response: Response<any, Record<string, any>>,
	): void {}

	deleteDataToken(
		request: Request,
		response: Response<any, Record<string, any>>,
	): void {}

	getAccessToken(request: Request): string {
		const authHeader = request.headers[this.headerNames.accessToken] as string;
		return authHeader?.replace("Bearer ", "");
	}

	getRefreshToken(request: Request): string {
		return request.headers[this.headerNames.refreshToken] as string;
	}

	getDataToken(request: Request): string {
		return request.headers[this.headerNames.dataToken] as string;
	}

	setAccessToken(request: Request, response: Response, token: string) {
		response.set(this.headerNames.accessToken, token);
	}

	setRefreshToken(request: Request, response: Response, token: string) {
		response.set(this.headerNames.refreshToken, token);
	}

	setDataToken(request: Request, response: Response, token: string) {
		response.set(this.headerNames.dataToken, token);
	}
}
