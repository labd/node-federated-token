import {
	type ApolloServerPlugin,
	type GraphQLRequestContext,
	type GraphQLRequestListener,
} from "@apollo/server";
import { GraphQLError } from "graphql";
import { PublicFederatedToken } from "@labdigital/federated-token";
import { TokenSigner } from "@labdigital/federated-token";
import type { TokenSource } from "@labdigital/federated-token";
import { TokenExpiredError } from "@labdigital/federated-token";
import { PublicFederatedTokenContext } from "./context";

type GatewayOptions = {
	signer: TokenSigner;
	source: TokenSource;
};

/**
 * This plugin is used to authenticate requests coming into the gateway. It
 * reads the tokens from the request (using the token source provided),
 * validates them. When sending back the response it will also set the tokens
 * via the tokenSource on the response if the downstream services have
 * created/modified them.
 */
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
		requestContext: GraphQLRequestContext<TContext>,
	): Promise<void | GraphQLRequestListener<TContext>> {
		return this;
	}

	public async didResolveOperation(
		requestContext: GraphQLRequestContext<TContext>,
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
		// token is present then we assume a refresh is happening and the
		// accessToken is expired/invalid anyway
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
			try {
				await token.loadRefreshJWT(this.signer, refreshToken);
			} catch (e: unknown) {
				this.tokenSource.deleteRefreshToken(contextValue.res);
			}
		}
	}

	async willSendResponse(
		requestContext: GraphQLRequestContext<TContext>,
	): Promise<void> {
		const { contextValue } = requestContext;
		const token = contextValue?.federatedToken;
		const { req: request, res: response } = contextValue;

		// Downstream services modified the tokens, so create a new JWT and set
		// it on the response
		// TODO: We should optimize this, if only the values are modified then
		// we shouldn't have to create a new nested JWE
		if (token?.isAccessTokenModified() || token?.isValueModified()) {
			const { accessToken, fingerprint } = await token.createAccessJWT(
				this.signer,
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
