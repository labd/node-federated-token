import { Request, Response } from "express";

export interface TokenSource {
	deleteAccessToken(request: Request, response: Response): void;
	deleteRefreshToken(request: Request, response: Response): void;
	deleteDataToken(
		request: Request,
		response: Response<any, Record<string, any>>,
	): void;

	getAccessToken(request: Request): string | undefined;
	getDataToken(request: Request): string | undefined;
	getRefreshToken(request: Request): string | undefined;

	setDataToken(
		request: Request,
		response: Response,
		token: string,
		isAuthenticated?: boolean,
	): void;
	setAccessToken(
		request: Request,
		response: Response,
		token: string,
		isAuthenticated?: boolean,
	): void;
	setRefreshToken(
		request: Request,
		response: Response,
		token: string,
		isAuthenticated?: boolean,
	): void;
}
