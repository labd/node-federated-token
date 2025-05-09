import httpMocks from "node-mocks-http";
import { describe, expect, it } from "vitest";
import { HeaderTokenSource } from "./headers";

// Mock tokens
const mockRefreshToken = "mockRefreshToken";

describe("HeaderTokenSource", () => {
	it("should get the access token from headers", () => {
		const headerTokenSource = new HeaderTokenSource();
		const request = httpMocks.createRequest({
			headers: { "x-access-token": "Bearer FOOBAR" },
		});
		const result = headerTokenSource.getAccessToken(request);
		expect(result).toBe("FOOBAR");
	});

	it("should get the refresh token from headers", () => {
		const headerTokenSource = new HeaderTokenSource();
		const request = httpMocks.createRequest({
			headers: {
				"x-refresh-token": mockRefreshToken,
			},
		});
		const result = headerTokenSource.getRefreshToken(request);

		expect(result).toBe(mockRefreshToken);
	});

	it("should return an undefined value if access token is missing from headers", () => {
		const headerTokenSource = new HeaderTokenSource();
		const request = httpMocks.createRequest();
		const result = headerTokenSource.getAccessToken(request);
		expect(result).toBeUndefined();
	});

	it("should set the access token in the response headers", () => {
		const request = httpMocks.createRequest();
		const response = httpMocks.createResponse();
		const headerTokenSource = new HeaderTokenSource();
		headerTokenSource.setAccessToken(request, response, "foobar");
		expect(response.get("x-access-token")).toBe("foobar");
	});

	it("should set the refresh token in the response headers", () => {
		const request = httpMocks.createRequest();
		const response = httpMocks.createResponse();
		const headerTokenSource = new HeaderTokenSource();
		headerTokenSource.setRefreshToken(request, response, "foobar");
		expect(response.get("x-refresh-token")).toBe("foobar");
	});

	it("should set the data token in the response headers", () => {
		const request = httpMocks.createRequest();
		const response = httpMocks.createResponse();
		const headerTokenSource = new HeaderTokenSource();
		headerTokenSource.setDataToken(request, response, "mock-data-token");

		expect(response.getHeaders()).toStrictEqual({
			"x-data-token": "mock-data-token",
		});
	});
});
