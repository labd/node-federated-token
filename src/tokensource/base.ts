import { Request, Response } from "express";

export interface TokenSource {
	deleteAccessToken(response: Response): void;
	getAccessToken(request: Request): string;
	getRefreshToken(request: Request): string;
	getFingerprint(request: Request): string;
	setAccessToken(request: Request, response: Response, token: string): void;
	setRefreshToken(request: Request, response: Response, token: string): void;
	setFingerprint(
		request: Request,
		response: Response,
		fingerprint: string
	): void;
}
