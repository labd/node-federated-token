import { Request, Response } from "express";
import { TokenSource } from "./base";

export class CompositeTokenSource implements TokenSource {
	private sources: TokenSource[];

	constructor(sources: TokenSource[]) {
		this.sources = sources;
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

	setAccessToken(response: Response, token: string) {
		for (const source of this.sources) {
			source.setAccessToken(response, token);
		}
	}

	setRefreshToken(response: Response, token: string) {
		for (const source of this.sources) {
			source.setRefreshToken(response, token);
		}
	}

	setFingerprint(response: Response, fingerprint: string) {
		for (const source of this.sources) {
			source.setFingerprint(response, fingerprint);
		}
	}
}
