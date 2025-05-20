import {
	type BaseCookieSourceOptions,
	BaseCookieTokenSource,
	type CookieAdapter,
} from "@labdigital/federated-token/tokensource";
import type { CookieOptions, Request, Response } from "express";

type ExpressCookieSourceOptions = BaseCookieSourceOptions & {
	publicDomainFn?: (request: Request) => string | undefined;
	privateDomainFn?: (request: Request) => string | undefined;
};

class ExpressCookieAdapter implements CookieAdapter<Request, Response> {
	constructor(private options: ExpressCookieSourceOptions) {}

	getCookie(request: Request, name: string): string | undefined {
		return request.cookies[name];
	}

	setCookie(
		request: Request,
		response: Response,
		name: string,
		value: string,
		options: CookieOptions,
	): void {
		response.cookie(name, value, options);
	}

	clearCookie(
		request: Request,
		response: Response,
		name: string,
		options?: CookieOptions,
	): void {
		response.clearCookie(name, options);
	}

	getPublicDomain(request: Request): string | undefined {
		return this.options.publicDomainFn?.(request);
	}

	getPrivateDomain(request: Request): string | undefined {
		return this.options.privateDomainFn?.(request);
	}
}

export class CookieTokenSource extends BaseCookieTokenSource<
	Request,
	Response
> {
	protected adapter: CookieAdapter<Request, Response>;

	constructor(options: ExpressCookieSourceOptions) {
		super(options);
		this.adapter = new ExpressCookieAdapter(options);
	}
}
