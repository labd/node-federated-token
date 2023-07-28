import isEqual from 'lodash.isequal';

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

	private _accessTokenModified: boolean;
	private _refreshTokenModified: boolean;

	constructor() {
		this.tokens = {};
		this.refreshTokens = {};
		this.values = {};
		this._accessTokenModified = false;
		this._refreshTokenModified = false;
	}

	setAccessToken(name: string, token: AccessToken) {
		this.tokens[name] = token;
		this._accessTokenModified = true;
	}

	setRefreshToken(name: string, token: string) {
		this.refreshTokens[name] = token;
		this._refreshTokenModified = true;
	}

	isAccessTokenModified() {
		return this._accessTokenModified;
	}

	isRefreshTokenModified() {
		return this._refreshTokenModified;
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
				this._accessTokenModified = true;
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

	loadRefreshToken(value: string, trackModified = false) {
		const refreshTokens: Record<string, string> = JSON.parse(
			Buffer.from(value, "base64").toString("ascii")
		);

		// TODO: Validate json

		// Merge tokens in object
		for (const k in refreshTokens) {
			if (trackModified && !isEqual(this.refreshTokens[k], refreshTokens[k])) {
				this._refreshTokenModified = true;
			}
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
