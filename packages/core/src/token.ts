import isEqual from "lodash.isequal";

export type FederatedTokenContext = {
	federatedToken?: FederatedToken;
};

type FederatedTokenValue = {
	isAuthenticated?: boolean;
	destroyToken?: boolean;
	tokens?: Record<string, AccessToken>;
	values?: Record<string, any>;
};

export interface AccessToken {
	// Expire at, unixtime
	token: string;
	exp: number;

	// Subject, it is most often used for the user-id.
	sub: string;
}

export class FederatedToken {
	tokens: Record<string, AccessToken>;
	refreshTokens: Record<string, string>;
	values: Record<string, any>;

	private _hasData: boolean;
	private _accessTokenModified: boolean;
	private _refreshTokenModified: boolean;
	private _valueModified: boolean;

	private _isAuthenticated: boolean;
	private _destroyToken: boolean;

	constructor() {
		this.tokens = {};
		this.refreshTokens = {};
		this.values = {};
		this._destroyToken = false;
		this._isAuthenticated = false;
		this._accessTokenModified = false;
		this._refreshTokenModified = false;
		this._valueModified = false;
	}

	isAuthenticated(): boolean {
		return this._isAuthenticated;
	}

	shouldDestroyToken(): boolean {
		return this._destroyToken;
	}

	setIsAuthenticated(): void {
		this._isAuthenticated = true;
	}

	setIsAnonymous(): void {
		this._isAuthenticated = false;
	}

	clear() {
		this.tokens = {};
		this.refreshTokens = {};
		this._isAuthenticated = false;
		this._refreshTokenModified = true;
		this._accessTokenModified = true;
		this._valueModified = true;
		this._destroyToken = true;
	}

	setAccessToken(name: string, token: AccessToken) {
		this.tokens[name] = token;
		this._accessTokenModified = true;
	}

	setRefreshToken(name: string, token: string) {
		this.refreshTokens[name] = token;
		this._refreshTokenModified = true;
	}

	setValue(name: string, value: any): void {
		this.values[name] = value;
		this._valueModified = true;
	}

	isAccessTokenModified() {
		return this._accessTokenModified;
	}

	isRefreshTokenModified() {
		return this._refreshTokenModified;
	}

	isValueModified() {
		return this._valueModified;
	}

	isValid() {
		return this._hasData;
	}

	// Return the expire time of the first token that expires
	getExpireTime() {
		const values = Object.values(this.tokens);
		const sorted = values.sort((a, b) => a.exp - b.exp);
		return sorted[0].exp;
	}

	// serializeAccessToken serializes the tokens into a base64 encoded string
	// in order to be sent to downstream services and from the downstream
	// services back to the gateway. We try to keep this token as small as
	// possible, so empty / falsy fields are left out
	serializeAccessToken(): string | undefined {
		const token: FederatedTokenValue = {};
		if (Object.keys(this.tokens).length > 0) {
			token.tokens = this.tokens;
		}
		if (Object.keys(this.values).length > 0) {
			token.values = this.values;
		}

		if (this._isAuthenticated) {
			token.isAuthenticated = true;
		}

		if (this._destroyToken) {
			token.destroyToken = true;
		}

		if (!token) {
			return;
		}
		return Buffer.from(JSON.stringify(token)).toString("base64");
	}

	// deserializeAccessToken deserializes the tokens from a base64 encoded string
	// as received from downstream services
	deserializeAccessToken(at: string, trackModified = false) {
		const token: FederatedTokenValue = JSON.parse(
			Buffer.from(at, "base64").toString("ascii"),
		);

		this._hasData = true;

		if (trackModified) {
			this._valueModified = !isEqual(this.values, token.values);

			this._accessTokenModified = Object.keys(token.tokens ?? []).some(
				(key) => !isEqual(this.tokens[key], token.tokens?.[key]),
			);
		}
		// Set the authentication status, we only set it to true, never explicitly
		// to false since other federated services can also set it to true
		if (token.isAuthenticated) {
			this.setIsAuthenticated();
		}

		if (token.destroyToken) {
			this._destroyToken = true;
		}

		// Merge tokens and values into "this" object.
		this.tokens = {
			...this.tokens,
			...token.tokens,
		};
		this.values = {
			...this.values,
			...token.values,
		};
	}

	loadRefreshToken(value: string, trackModified = false) {
		const refreshTokens: Record<string, string> = JSON.parse(
			Buffer.from(value, "base64").toString("ascii"),
		);

		this._hasData = true;

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
