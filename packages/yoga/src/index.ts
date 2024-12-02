import type { Plugin } from "graphql-yoga";
import { FederatedToken } from "@labdigital/federated-token";

type FederatedTokenContext = {
	federatedToken: FederatedToken;
};

export const useFederatedToken = <T extends FederatedTokenContext>(): Plugin<
	T,
	T
> => ({
	onContextBuilding: ({ context, extendContext }) => {
		if (!context.federatedToken) {
			throw new Error("Federated token not found in context");
		}
		if (!context.request) {
			throw new Error("Request not found in context");
		}

		const { request, federatedToken } = context;
		const accessToken = request.headers.get("x-access-token");
		const refreshToken = request.headers.get("x-refresh-token");
		if (accessToken) {
			federatedToken.deserializeAccessToken(accessToken);
		}
		if (refreshToken) {
			federatedToken.loadRefreshToken(refreshToken);
		}
	},

	onResponse: async ({ response, serverContext }) => {
		const { federatedToken } = serverContext;
		if (!federatedToken) return;

		// Check if the tokens were modified and set headers accordingly
		if (
			federatedToken.isAccessTokenModified() ||
			federatedToken.isValueModified()
		) {
			const serializedToken = federatedToken.serializeAccessToken();
			if (serializedToken) {
				response.headers.set("X-Access-Token", serializedToken);
			}
		}

		if (federatedToken.isRefreshTokenModified()) {
			const serializedRefreshToken = federatedToken.dumpRefreshToken();
			if (serializedRefreshToken) {
				response.headers.set("X-Refresh-Token", serializedRefreshToken);
			}
		}
	},
});
