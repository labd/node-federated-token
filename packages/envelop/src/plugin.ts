import type { Plugin } from "@envelop/core";
import { FederatedToken } from "@labdigital/federated-token";

type FederatedTokenContext = {
	federatedToken: FederatedToken;
	request: Request;
	response: Response;
};

export const federatedAuthPlugin = (): Plugin<FederatedTokenContext> => ({
	onContextBuilding: ({ context, extendContext }) => {
		const req = context["request"] || {};

		// Initialize FederatedToken and add it to the context
		const federatedToken = new FederatedToken();

		// Retrieve tokens from headers using the serverContext
		const accessToken = req.headers.get("x-access-token") as string;
		const refreshToken = req.headers.get("x-refresh-token") as string;

		if (accessToken) {
			federatedToken.deserializeAccessToken(accessToken);
		}

		if (refreshToken) {
			federatedToken.loadRefreshToken(refreshToken);
		}

		// Extend the context with federatedToken
		extendContext({ federatedToken });
	},

	onExecute: ({ args }) => ({
		onExecuteDone: async ({ result }) => {
			const { federatedToken } = args.contextValue;
			const { response } = args.contextValue;

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
	}),
});
