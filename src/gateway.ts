import {
	type ApolloServerPlugin,
	type GraphQLRequestContext,
	type GraphQLRequestListener,
} from "@apollo/server";
import { GraphQLError } from "graphql";
import {
	PublicFederatedToken,
	PublicFederatedTokenContext,
	TokenExpiredError,
} from "./jwt.js";
import { TokenSigner } from "./sign.js";
import { TokenSource } from "./tokensource/base.js";

type GatewayOptions = {
	signer: TokenSigner;
	source: TokenSource;
};

export class GatewayAuthPlugin<TContext extends PublicFederatedTokenContext>
	implements ApolloServerPlugin, GraphQLRequestListener<TContext>
{
	private signer: TokenSigner;
	private tokenSource: TokenSource;

	constructor(options: GatewayOptions) {
		this.signer = options.signer;
		this.tokenSource = options.source;
	}

	public async requestDidStart(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void | GraphQLRequestListener<TContext>> {
		return this;
	}

	public async didResolveOperation(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void> {
		const { contextValue } = requestContext;
		const request = contextValue.req;

		const accessToken = this.tokenSource.getAccessToken(request);
		const refreshToken = this.tokenSource.getRefreshToken(request);
		const fingerprint = this.tokenSource.getFingerprint(request);

		if (!accessToken && !refreshToken) {
			return;
		}

		if (!contextValue.federatedToken) {
			contextValue.federatedToken = new PublicFederatedToken();
		}

		const token = contextValue.federatedToken;

		// Only load the access token if there is no refresh token. If a refresh
		// token is present then we assume a refresh is happening
		if (accessToken && !refreshToken) {
			try {
				await token.loadAccessJWT(this.signer, accessToken, fingerprint);
			} catch (e: unknown) {
				this.tokenSource.deleteAccessToken(contextValue.res);
				if (e instanceof TokenExpiredError) {
					throw new GraphQLError("Your token has expired.", {
						extensions: {
							code: "UNAUTHENTICATED",
							http: {
								statusCode: 401,
							},
						},
					});
				} else {
					throw new GraphQLError("Your token is invalid.", {
						extensions: {
							code: "INVALID_TOKEN",
							http: {
								statusCode: 400,
							},
						},
					});
				}
			}
		}

		if (refreshToken) {
			await token.loadRefreshJWT(this.signer, refreshToken);
		}
	}

	async willSendResponse(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void> {
		const { contextValue } = requestContext;
		const token = contextValue?.federatedToken;
		const { req: request, res: response } = contextValue;

		if (token?.isAccessTokenModified()) {
			const { accessToken, fingerprint } = await token.createAccessJWT(
				this.signer
			);

			if (accessToken && fingerprint) {
				this.tokenSource.setAccessToken(request, response, accessToken);
				this.tokenSource.setFingerprint(request, response, fingerprint);
			}
		}

		if (token?.isRefreshTokenModified()) {
			const refreshToken = await token.createRefreshJWT(this.signer);
			this.tokenSource.setRefreshToken(request, response, refreshToken);
		}
	}
}
