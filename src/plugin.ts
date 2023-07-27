import {
	type ApolloServerPlugin,
	type GraphQLRequestContext,
	type GraphQLRequestListener,
} from "@apollo/server";
import { FederatedToken, FederatedTokenContext } from "./token";

export class FederatedAuthPlugin<TContext extends FederatedTokenContext>
	implements ApolloServerPlugin, GraphQLRequestListener<TContext>
{
	public async requestDidStart(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void | GraphQLRequestListener<TContext>> {
		const { contextValue, request } = requestContext;
		if (!contextValue.federatedToken) {
			contextValue.federatedToken = new FederatedToken();
		}

		const at = request.http?.headers.get("X-Access-Token");
		if (at) {
			contextValue.federatedToken.loadAccessToken(at);
		}

		const rt = request.http?.headers.get("X-Refresh-Token");
		if (rt) {
			contextValue.federatedToken.loadRefreshToken(rt);
		}
		return this;
	}

	async willSendResponse(
		requestContext: GraphQLRequestContext<TContext>
	): Promise<void> {
		const { contextValue, response } = requestContext;

		if (!contextValue.federatedToken) {
			return;
		}

		const t = contextValue.federatedToken;

		if (t.isAccessTokenModified()) {
			const val = t.dumpAccessToken();
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
