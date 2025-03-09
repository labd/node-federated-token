import type {
	ApolloServerPlugin,
	GraphQLRequestContext,
	GraphQLRequestContextDidResolveSource,
	GraphQLRequestListener,
} from "@apollo/server";
import { PublicFederatedToken } from "@labdigital/federated-token";
import type { TokenSigner } from "@labdigital/federated-token";
import type { TokenSource } from "@labdigital/federated-token";
import { TokenExpiredError } from "@labdigital/federated-token";
import { GraphQLError } from "graphql";
import type { PublicFederatedTokenContext } from "./context";

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
	): Promise<GraphQLRequestListener<TContext>> {
		const { contextValue } = requestContext;
		const request = contextValue.req;

		const accessToken = this.tokenSource.getAccessToken(request);
		const refreshToken = this.tokenSource.getRefreshToken(request);
		const dataToken = this.tokenSource.getDataToken(request);

		if (!accessToken && !refreshToken) {
			return this;
		}

		if (!contextValue.federatedToken) {
			contextValue.federatedToken = new PublicFederatedToken();
		}

		const token = contextValue.federatedToken;

		if (accessToken) {
			try {
				await token.loadAccessJWT(this.signer, accessToken);
			} catch (e: unknown) {
				this.tokenSource.deleteAccessToken(contextValue.req, contextValue.res);

				if (e instanceof TokenExpiredError) {
					return {
						didResolveOperation: async (
							requestContext: GraphQLRequestContextDidResolveSource<TContext>,
						) => {
							requestContext.response.http.status = 401;
							throw new GraphQLError("Your token has expired.", {
								extensions: {
									code: "UNAUTHENTICATED",
									http: {
										statusCode: 401,
									},
								},
							});
						},
					};
				} else {
					return {
						didResolveOperation: async (
							requestContext: GraphQLRequestContextDidResolveSource<TContext>,
						) => {
							requestContext.response.http.status = 401;
							throw new GraphQLError("Your token is invalid.", {
								extensions: {
									code: "INVALID_TOKEN",
									http: {
										statusCode: 400,
									},
								},
							});
						},
					};
				}
			}
		}

		if (refreshToken) {
			try {
				await token.loadRefreshJWT(this.signer, refreshToken);
			} catch (e: unknown) {
				this.tokenSource.deleteRefreshToken(contextValue.req, contextValue.res);
			}
		}

		if (dataToken) {
			try {
				await token.loadDataJWT(this.signer, dataToken);
			} catch (e: unknown) {
				this.tokenSource.deleteDataToken(contextValue.req, contextValue.res);
				if (e instanceof TokenExpiredError) {
					return {
						didResolveOperation: async (
							requestContext: GraphQLRequestContextDidResolveSource<TContext>,
						) => {
							requestContext.response.http.status = 401;
							throw new GraphQLError("Your token has expired.", {
								extensions: {
									code: "UNAUTHENTICATED",
									http: {
										statusCode: 401,
									},
								},
							});
						},
					};
				} else {
					return {
						didResolveOperation: async (
							requestContext: GraphQLRequestContextDidResolveSource<TContext>,
						) => {
							requestContext.response.http.status = 401;
							throw new GraphQLError("Your token is invalid.", {
								extensions: {
									code: "INVALID_TOKEN",
									http: {
										statusCode: 400,
									},
								},
							});
						},
					};
				}
			}
		}
		return this;
	}

	async willSendResponse(
		requestContext: GraphQLRequestContext<TContext>,
	): Promise<void> {
		const { contextValue } = requestContext;
		const token = contextValue?.federatedToken;
		const { req: request, res: response } = contextValue;

		const isAuthenticated = token?.isAuthenticated() ?? false;

		if (token?.shouldDestroyToken()) {
			this.tokenSource.deleteAccessToken(request, response);
			this.tokenSource.deleteRefreshToken(request, response);
			this.tokenSource.deleteDataToken(request, response);
			return;
		}

		// Downstream services modified the tokens, so create a new JWT and set
		// it on the response
		if (token?.isAccessTokenModified()) {
			const accessToken = await token.createAccessJWT(this.signer);
			if (accessToken) {
				this.tokenSource.setAccessToken(
					request,
					response,
					accessToken,
					isAuthenticated,
				);
			}
		}

		if (token?.isValueModified()) {
			const dataToken = await token.createDataJWT(this.signer);
			if (dataToken) {
				this.tokenSource.setDataToken(
					request,
					response,
					dataToken,
					isAuthenticated,
				);
			}
		}

		if (token?.isRefreshTokenModified()) {
			const refreshToken = await token.createRefreshJWT(this.signer);
			this.tokenSource.setRefreshToken(
				request,
				response,
				refreshToken,
				isAuthenticated,
			);
		}
	}
}
