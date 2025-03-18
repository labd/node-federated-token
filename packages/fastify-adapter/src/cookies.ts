import type { CookieSerializeOptions } from "@fastify/cookie";
import {
	type BaseCookieSourceOptions,
	BaseCookieTokenSource,
	type CookieAdapter,
} from "@labdigital/federated-token/tokensource";
import type { FastifyReply, FastifyRequest } from "fastify";

type FastifyCookieSourceOptions = BaseCookieSourceOptions & {
	publicDomainFn?: (request: FastifyRequest) => string | undefined;
	privateDomainFn?: (request: FastifyRequest) => string | undefined;
};

class FastifyCookieAdapter
	implements CookieAdapter<FastifyRequest, FastifyReply>
{
	constructor(private options: FastifyCookieSourceOptions) {}

	getCookie(request: FastifyRequest, name: string): string | undefined {
		return request.cookies?.[name];
	}

	setCookie(
		request: FastifyRequest,
		response: FastifyReply,
		name: string,
		value: string,
		options: CookieSerializeOptions,
	): void {
		response.setCookie(name, value, options);
	}

	clearCookie(
		request: FastifyRequest,
		response: FastifyReply,
		name: string,
		options?: CookieSerializeOptions,
	): void {
		response.clearCookie(name, options);
	}

	getPublicDomain(request: FastifyRequest): string | undefined {
		return this.options.publicDomainFn?.(request);
	}

	getPrivateDomain(request: FastifyRequest): string | undefined {
		return this.options.privateDomainFn?.(request);
	}
}

export class CookieTokenSource extends BaseCookieTokenSource<
	FastifyRequest,
	FastifyReply
> {
	protected adapter: CookieAdapter<FastifyRequest, FastifyReply>;

	constructor(options: FastifyCookieSourceOptions) {
		super(options);
		this.adapter = new FastifyCookieAdapter(options);
	}
}
