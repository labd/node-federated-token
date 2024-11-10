import type { Plugin } from "graphql-yoga";
import { FederatedToken } from "@labdigital/federated-token";

type FederatedTokenContext = {
	federatedToken: FederatedToken;
};

export const useFederatedToken = <T extends FederatedTokenContext>(): Plugin<
	object,
	T
> => ({
	onRequest: ({ request, serverContext }) => {
		// Initialize FederatedToken and add it to the context
		const federatedToken = serverContext.federatedToken ?? new FederatedToken();

		// Retrieve tokens from headers using the serverContext
		const accessToken = request.headers.get("x-access-token") as string;
		const refreshToken = request.headers.get("x-refresh-token") as string;

		if (accessToken) {
			federatedToken.deserializeAccessToken(accessToken);
		}

		if (refreshToken) {
			federatedToken.loadRefreshToken(refreshToken);
		}

		serverContext.federatedToken = federatedToken;
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
