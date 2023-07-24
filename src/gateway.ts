import {
	ApolloServerPlugin,
	GraphQLRequestContext,
	GraphQLRequestListener,
} from "@apollo/server";
import {
	PublicFederatedToken,
	PublicFederatedTokenContext,
	TokenSigner,
} from "./jwt";
import { GraphQLError } from "graphql";

export class GatewayAuthPlugin<TContext extends PublicFederatedTokenContext>
	implements ApolloServerPlugin, GraphQLRequestListener<TContext>
{
	constructor(private signer: TokenSigner) {}

	public async requestDidStart(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void | GraphQLRequestListener<TContext>> {
		return this;
	}

	public async didResolveOperation(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void> {
		const { contextValue, request } = requestContext;
		const authHeader = request.http?.headers.get("Authorization");
		const at = authHeader?.replace("Bearer ", "");

		if (at) {
			if (!contextValue.federatedToken) {
				contextValue.federatedToken = new PublicFederatedToken();
			}
			try {
				await contextValue.federatedToken.loadAccessJWT(this.signer, at);
			} catch (e) {
				throw new GraphQLError(
					"You are not authorized to perform this action.",
					{
						extensions: {
							code: "FORBIDDEN",
						},
					}
				);
			}
		}

		const rt = request.http?.headers.get("x-refresh-token")
		if (rt) {
			await contextValue.federatedToken?.loadRefreshJWT(this.signer, rt);
		}
	}

	async willSendResponse(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void> {
		const { contextValue, response } = requestContext;
		const token = contextValue?.federatedToken;

		if (!token?.isModified()) {
			return;
		}
		const accessToken = await token.createAccessJWT(this.signer);
		if (accessToken) {
			response.http.headers.set("X-Access-Token", accessToken);
		}

		const refreshToken = await token.createRefreshJWT(this.signer);
		if (refreshToken) {
			response.http.headers.set("X-Refresh-Token", refreshToken);
		}
	}
}
