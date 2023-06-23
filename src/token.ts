import isEqual from "lodash-es/isEqual";

export type FederatedTokenContext = {
	federatedToken?: FederatedToken;
};

export interface AccessToken {
	// Expire at, unixtime
	token: string;
	exp: number;
}

export class FederatedToken {
	tokens: Record<string, AccessToken>;
	refreshTokens: Record<string, string>;
	values: Record<string, any>;

	private _modified: boolean;

	constructor() {
		this.tokens = {};
		this.refreshTokens = {};
		this.values = {};
		this._modified = false;
	}

	setAccessToken(name: string, token: AccessToken) {
		this.tokens[name] = token;
		this._modified = true;
	}

	setRefreshToken(name: string, token: string) {
		this.refreshTokens[name] = token;
	}

	isModified() {
		return this._modified;
	}

	loadAccessToken(at: string, trackModified = false) {
		const token = JSON.parse(Buffer.from(at, "base64").toString("ascii"));

		// TODO: Validate json

		if (token.refreshTokens) {
			throw new Error("Refresh tokens are not allowed in the Access Token");
		}

		// Merge tokens into this object
		for (const k in token.tokens) {
			if (trackModified && !isEqual(this.tokens[k], token.tokens[k])) {
				this._modified = true;
			}

			this.tokens[k] = token.tokens[k];
		}

		this.tokens = token.tokens;
		for (const k in token) {
			if (k !== "tokens") {
				this.values[k] = token[k];
			}
		}
	}

	dumpAccessToken(): string | undefined {
		const data = {
			tokens: this.tokens,
			...this.values,
		};

		if (!data) {
			return;
		}
		return Buffer.from(JSON.stringify(data)).toString("base64");
	}


	loadRefreshToken(value: string) {
		const refreshTokens: Record<string, string> = JSON.parse(
			Buffer.from(value, "base64").toString("ascii")
		);

		// TODO: Validate json

		// Merge tokens in object
		for (const k in refreshTokens) {
			this.refreshTokens[k] = refreshTokens[k];
		}
	}

	dumpRefreshToken(): string | undefined {
		if (!this.refreshTokens) {
			return;
		}
		return Buffer.from(JSON.stringify(this.refreshTokens)).toString("base64");
	}
}
