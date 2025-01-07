import type { BaseContext } from "@apollo/server";
import type { PublicFederatedToken } from "@labdigital/federated-token";
import type { Request, Response } from "express";

export type PublicFederatedTokenContext = {
	federatedToken?: PublicFederatedToken;
	res: Response;
	req: Request;
} & BaseContext;
