import type { BaseContext } from "@apollo/server";
import type { PublicFederatedToken } from "@labdigital/federated-token";

export type PublicFederatedTokenContext<TRequest, TResponse> = {
	federatedToken?: PublicFederatedToken;
	res: TResponse;
	req: TRequest;
} & BaseContext;
