import { Request, Response } from "express";
import { TokenSource } from "./base.js";

export class CompositeTokenSource implements TokenSource {
	private sources: TokenSource[];

	constructor(sources: TokenSource[]) {
		this.sources = sources;
	}

	deleteAccessToken(response: Response): void {
		for (const source of this.sources) {
			source.deleteAccessToken(response);
		}
	}

	getAccessToken(request: Request): string {
		for (const source of this.sources) {
			const token = source.getAccessToken(request);
			if (token) {
				return token;
			}
		}
		return "";
	}

	getRefreshToken(request: Request): string {
		for (const source of this.sources) {
			const token = source.getRefreshToken(request);
			if (token) {
				return token;
			}
		}
		return "";
	}

	getFingerprint(request: Request): string {
		for (const source of this.sources) {
			const token = source.getFingerprint(request);
			if (token) {
				return token;
			}
		}
		return "";
	}

	setAccessToken(request: Request, response: Response, token: string) {
		for (const source of this.sources) {
			source.setAccessToken(request, response, token);
		}
	}

	setRefreshToken(request: Request, response: Response, token: string) {
		for (const source of this.sources) {
			source.setRefreshToken(request, response, token);
		}
	}

	setFingerprint(request: Request, response: Response, fingerprint: string) {
		for (const source of this.sources) {
			source.setFingerprint(request, response, fingerprint);
		}
	}
}
