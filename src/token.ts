import isEqual from "lodash.isequal";

export type FederatedTokenContext = {
	federatedToken?: FederatedToken;
};

type FederatedTokenValue = {
	tokens: Record<string, AccessToken>;
	values: Record<string, any>;
};

type FederatedRefreshTokenValue = {
	refreshTokens: Record<string, string>;
	values: Record<string, any>;
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

	private _accessTokenModified: boolean;
	private _refreshTokenModified: boolean;
	private _valueModified: boolean;

	constructor() {
		this.tokens = {};
		this.refreshTokens = {};
		this.values = {};
		this._accessTokenModified = false;
		this._refreshTokenModified = false;
		this._valueModified = false;
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

	// Return the expire time of the first token that expires
	getExpireTime() {
		const values = Object.values(this.tokens);
		const sorted = values.sort((a, b) => a.exp - b.exp);
		return sorted[0].exp;
	}

	// serializeAccessToken serializes the tokens into a base64 encoded string
	// in order to be sent to downstream services and from the downstream
	// services back to the gatewa
	// in order to be sent to downstream services and from the downstream
	serializeAccessToken(): string | undefined {
		const data: FederatedTokenValue = {
			tokens: this.tokens,
			values: this.values,
		};

		return Buffer.from(JSON.stringify(data)).toString("base64");
	}

	// deserializeAccessToken deserializes the tokens from a base64 encoded string
	// as received from downstream services
	deserializeAccessToken(at: string, trackModified = false) {
		const token: FederatedTokenValue = JSON.parse(
			Buffer.from(at, "base64").toString("ascii")
		);

		if (trackModified) {
			this._valueModified = !isEqual(this.values, token.values);

			this._accessTokenModified = Object.keys(token.tokens).some(
				(key) => !isEqual(this.tokens[key], token.tokens[key])
			);
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

	deserializeRefreshToken(value: string, trackModified = false) {
		const token: FederatedRefreshTokenValue = JSON.parse(
			Buffer.from(value, "base64").toString("ascii")
		);

		if (trackModified) {
			this._valueModified = !isEqual(this.values, token.values);
			this._refreshTokenModified = Object.keys(token.refreshTokens).some(
				(key) => !isEqual(this.refreshTokens[key], token.refreshTokens[key])
			);
		}
		this.refreshTokens = {
			...this.refreshTokens,
			...token.refreshTokens,
		};
		this.values = token.values;
	}

	serializeRefreshToken(): string | undefined {
		if (!this.refreshTokens) {
			return;
		}

		const data: FederatedRefreshTokenValue = {
			refreshTokens: this.refreshTokens,
			values: this.values,
		};

		return Buffer.from(JSON.stringify(data)).toString("base64");
	}
}
