import type {
	ApolloServerPlugin,
	GraphQLRequestContext,
	GraphQLRequestListener,
} from "@apollo/server";
import {
	FederatedToken,
	type FederatedTokenContext,
} from "@labdigital/federated-token";

// FederatedAuthPlugin is an Apollo plugin which should be used by all
// downstream services. It reads the information from the request headers as
// set by the GatewayAuthPlugin and sets the information on the response
// headers for the GatewayAuthPlugin to be consumed.
export class FederatedAuthPlugin<TContext extends FederatedTokenContext>
	implements ApolloServerPlugin, GraphQLRequestListener<TContext>
{
	public async requestDidStart(
		requestContext: GraphQLRequestContext<TContext>,
	): Promise<GraphQLRequestListener<TContext>> {
		const { contextValue, request } = requestContext;
		if (!contextValue.federatedToken) {
			contextValue.federatedToken = new FederatedToken();
		}

		const at = request.http?.headers.get("X-Access-Token");
		if (at) {
			contextValue.federatedToken.deserializeAccessToken(at);
		}

		const rt = request.http?.headers.get("X-Refresh-Token");
		if (rt) {
			contextValue.federatedToken.loadRefreshToken(rt);
		}
		return this;
	}

	async willSendResponse(
		requestContext: GraphQLRequestContext<TContext>,
	): Promise<void> {
		const { contextValue, response } = requestContext;

		if (!contextValue.federatedToken) {
			return;
		}

		const t = contextValue.federatedToken;

		if (t.isAccessTokenModified() || t.isValueModified()) {
			const val = t.serializeAccessToken();
			if (val) {
				response.http.headers.set("X-Access-Token", val);
			}
		}

		if (t.isRefreshTokenModified()) {
			const val = t.dumpRefreshToken();
			if (val) {
				response.http.headers.set("X-Refresh-Token", val);
			}
		}
	}
}
