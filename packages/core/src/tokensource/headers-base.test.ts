import { describe, expect, it } from "vitest";
import {
	type BaseHeaderSourceOptions,
	BaseHeaderTokenSource,
	type HeaderAdapter,
} from "./headers-base";

class TestHeaderAdapter implements HeaderAdapter<Request, Response> {
	getHeader(request: Request, name: string): string | undefined {
		return request.headers.get(name.toLowerCase()) as string | undefined;
	}

	setHeader(response: Response, name: string, value: string): void {
		response.headers.set(name, value);
	}
}

class TestHeaderTokenSource extends BaseHeaderTokenSource<Request, Response> {
	protected adapter: HeaderAdapter<Request, Response>;

	constructor(options?: BaseHeaderSourceOptions) {
		super(options);
		this.adapter = new TestHeaderAdapter();

		process.emitWarning(
			"Please import HeaderTokenSource from the @labdigital/federated-token-express-adapter",
			"DeprecationWarning",
		);
	}
}

// Mock tokens
const mockRefreshToken = "mockRefreshToken";

describe("HeaderTokenSource", () => {
	it("should get the access token from headers", () => {
		const headerTokenSource = new TestHeaderTokenSource();
		const request: Request = new Request("http://localhost", {
			headers: { "x-access-token": "Bearer FOOBAR" },
		});
		const result = headerTokenSource.getAccessToken(request);
		expect(result).toBe("FOOBAR");
	});

	it("should get the refresh token from headers", () => {
		const headerTokenSource = new TestHeaderTokenSource();
		const request = new Request("http://localhost", {
			headers: {
				"x-refresh-token": mockRefreshToken,
			},
		});
		const result = headerTokenSource.getRefreshToken(request);

		expect(result).toBe(mockRefreshToken);
	});

	it("should return an undefined value if access token is missing from headers", () => {
		const headerTokenSource = new TestHeaderTokenSource();
		const request = new Request("http://localhost");
		const result = headerTokenSource.getAccessToken(request);
		expect(result).toBeUndefined();
	});

	it("should set the access token in the response headers", () => {
		const request = new Request("http://localhost");
		const response = new Response();
		const headerTokenSource = new TestHeaderTokenSource();
		headerTokenSource.setAccessToken(request, response, "foobar");
		expect(response.headers.get("x-access-token")).toBe("foobar");
	});

	it("should set the refresh token in the response headers", () => {
		const request = new Request("http://localhost");
		const response = new Response();
		const headerTokenSource = new TestHeaderTokenSource();
		headerTokenSource.setRefreshToken(request, response, "foobar");
		expect(response.headers.get("x-refresh-token")).toBe("foobar");
	});

	it("should set the data token in the response headers", () => {
		const request = new Request("http://localhost");
		const response = new Response();
		const headerTokenSource = new TestHeaderTokenSource();
		headerTokenSource.setDataToken(request, response, "mock-data-token");

		expect(Object.fromEntries(response.headers.entries())).toStrictEqual({
			"x-data-token": "mock-data-token",
		});
	});
});
