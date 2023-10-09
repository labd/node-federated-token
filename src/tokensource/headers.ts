import { Request, Response } from "express";
import { TokenSource } from "./base.js";

export class HeaderTokenSource implements TokenSource {
	headerNames = {
		accessToken: "x-access-token",
		refreshToken: "x-refresh-token",
	};

	getAccessToken(request: Request): string {
		const authHeader = request.headers[this.headerNames.accessToken] as string;
		return authHeader?.replace("Bearer ", "");
	}

	getRefreshToken(request: Request): string {
		return request.headers[this.headerNames.refreshToken] as string;
	}

	getFingerprint(request: Request): string {
		return "";
	}

	setAccessToken(request: Request, response: Response, token: string) {
		response.set(this.headerNames.accessToken, token);
	}

	setRefreshToken(request: Request, response: Response, token: string) {
		response.set(this.headerNames.refreshToken, token);
	}

	setFingerprint(request: Request, response: Response, fingerprint: string) {}
}
