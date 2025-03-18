import {
	type BaseHeaderSourceOptions,
	BaseHeaderTokenSource,
	type HeaderAdapter,
} from "@labdigital/federated-token/tokensource";
import type { FastifyReply, FastifyRequest } from "fastify";

class FastifyHeaderAdapter
	implements HeaderAdapter<FastifyRequest, FastifyReply>
{
	getHeader(request: FastifyRequest, name: string): string | undefined {
		return request.headers[name.toLowerCase()] as string | undefined;
	}

	setHeader(response: FastifyReply, name: string, value: string): void {
		response.header(name, value);
	}
}

export class HeaderTokenSource extends BaseHeaderTokenSource<
	FastifyRequest,
	FastifyReply
> {
	protected adapter: HeaderAdapter<FastifyRequest, FastifyReply>;

	constructor(options?: BaseHeaderSourceOptions) {
		super(options);
		this.adapter = new FastifyHeaderAdapter();
	}
}
