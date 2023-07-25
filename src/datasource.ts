import {
	GraphQLDataSourceProcessOptions,
	RemoteGraphQLDataSource,
} from "@apollo/gateway";
import { HeaderMap } from "@apollo/server";
import { GatewayGraphQLResponse } from "@apollo/server-gateway-interface";
import { PublicFederatedToken, PublicFederatedTokenContext } from "./jwt";

// FederatedGraphQLDataSource is a RemoteGraphQLDataSource that adds the
// x-access-token and x-refresh-token headers to the request and reads the
// x-access-token and x-refresh-token headers from the response.
// It works in conjunction with the GatewayAuthPlugin.
export class FederatedGraphQLDataSource extends RemoteGraphQLDataSource<PublicFederatedTokenContext> {
	private name: string;

	constructor({ name, url }: { name: string; url: string }) {
		super({ url });
		this.name = name;
	}

	willSendRequest(
		options: GraphQLDataSourceProcessOptions
	): void | Promise<void> {
		const { request, context } = options;
		const headers = request.http?.headers ?? new HeaderMap();

		// TODO: We now blindly sent the access tokens and refresh tokens to all
		// federated services. This is something we might want to whitelist.
		const token = context.federatedToken.dumpAccessToken();
		if (token) {
			headers.set("x-access-token", token);
		}

		const refreshToken = context.federatedToken.dumpRefreshToken();
		if (refreshToken) {
			headers.set("x-refresh-token", refreshToken);
		}
	}

	public async didReceiveResponse({
		response,
		context,
	}: {
		response: GatewayGraphQLResponse;
		context: PublicFederatedTokenContext;
	}): Promise<GatewayGraphQLResponse> {
		if (!response.http?.headers) {
			return response;
		}
		const headers = response.http?.headers;

		const token = headers.get("x-access-token");
		if (token) {
			if (!context.federatedToken) {
				context.federatedToken = new PublicFederatedToken();
			}
			context.federatedToken.loadAccessToken(token, true);
		}

		const refreshToken = headers.get("x-refresh-token");
		if (refreshToken) {
			if (!context.federatedToken) {
				context.federatedToken = new PublicFederatedToken();
			}
			context.federatedToken.loadRefreshToken(refreshToken, true);
		}
		return response;
	}
}
