import {
	type BaseHeaderSourceOptions,
	BaseHeaderTokenSource,
	type HeaderAdapter,
} from "@labdigital/federated-token/tokensource";
import type { Request, Response } from "express";

class ExpressHeaderAdapter implements HeaderAdapter<Request, Response> {
	getHeader(request: Request, name: string): string | undefined {
		return request.headers[name.toLowerCase()] as string | undefined;
	}

	setHeader(response: Response, name: string, value: string): void {
		response.set(name, value);
	}
}

export class HeaderTokenSource extends BaseHeaderTokenSource<
	Request,
	Response
> {
	protected adapter: HeaderAdapter<Request, Response>;

	constructor(options?: BaseHeaderSourceOptions) {
		super(options);
		this.adapter = new ExpressHeaderAdapter();
	}
}
