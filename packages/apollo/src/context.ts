import { BaseContext } from "@apollo/server";
import { PublicFederatedToken } from "@labdigital/federated-token";
import { type Request, type Response } from "express";

export type PublicFederatedTokenContext = {
	federatedToken?: PublicFederatedToken;
	res: Response;
	req: Request;
} & BaseContext;
