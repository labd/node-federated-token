import httpMocks from "node-mocks-http";
import { describe, it, expect } from "vitest";
import { CookieTokenSource } from "./cookies.js";

describe("CookieTokenSource", () => {
	it("should get the access token from cookies", () => {
		const request = httpMocks.createRequest();
		request.cookies = { authToken: "FOOBAR" };

		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});
		const result = cookieTokenSource.getAccessToken(request);
		expect(result).toBe("FOOBAR");
	});

	it("should get the refresh token from cookies", () => {
		const request = httpMocks.createRequest({
			cookies: { "__Host-authRefreshToken": "FOOBAR" },
		});
		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});
		const result = cookieTokenSource.getRefreshToken(request);
		expect(result).toBe("FOOBAR");
	});
});
