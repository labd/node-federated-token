import type { SerializeOptions as CookieSerializeOptions } from "cookie";
import httpMocks from "node-mocks-http";
import { describe, expect, it } from "vitest";
import { CookieTokenSource } from "./cookies";

const createMockResponse = () => {
	const res = httpMocks.createResponse();

	// @ts-expect-error cookies is not defined on the response
	res.cookie = (
		name: string,
		value: string,
		options: CookieSerializeOptions,
	) => {
		res.cookies = res.cookies || {};
		res.cookies[name] = { value, options };
		return res;
	};

	res.clearCookie = (name: string, options?: CookieSerializeOptions) => {
		res.cookies = res.cookies || {};
		delete res.cookies[name];
		return res;
	};

	return res;
};

describe("CookieTokenSource", () => {
	// Test for default cookie names
	it("should use default cookie names", () => {
		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		const result = cookieTokenSource["cookieNames"];
		expect(result).toStrictEqual({
			userData: "userData",
			guestData: "guestData",
			userToken: "userToken",
			guestToken: "guestToken",
			userRefreshTokenExists: "userRefreshTokenExists",
			refreshToken: "refreshToken",
			guestRefreshTokenExists: "guestRefreshTokenExists",
		});
	});

	// Test for overriding cookie names
	it("should override cookie names", () => {
		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
			cookieNames: {
				userData: "userData",
				guestData: "guestData",
				userToken: "customUserToken",
				guestToken: "customGuestToken",
				userRefreshTokenExists: "userRefreshTokenExists",
				refreshToken: "authRefreshToken",
				guestRefreshTokenExists: "guestRefreshTokenExists",
			},
		});

		const result = cookieTokenSource["cookieNames"];
		expect(result).toStrictEqual({
			userData: "userData",
			guestData: "guestData",
			userToken: "customUserToken",
			guestToken: "customGuestToken",
			userRefreshTokenExists: "userRefreshTokenExists",
			refreshToken: "authRefreshToken",
			guestRefreshTokenExists: "guestRefreshTokenExists",
		});
	});

	// Test for getting the access token
	it("should get the access token from cookies", () => {
		const request = httpMocks.createRequest({
			cookies: {
				userToken: "USER_TOKEN",
			},
		});

		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		const result = cookieTokenSource.getAccessToken(request);
		expect(result).toBe("USER_TOKEN");
	});

	// Test for setting the access token for authenticated users
	it("should set the access token for authenticated users", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", true);

		expect(response.cookies["userToken"].value).toBe("FOOBAR");
		expect(response.cookies["userToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: undefined,
			expires: undefined,
			path: undefined,
		});
	});

	it("should set the access token for authenticated users with custom expire", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
			userToken: {
				expiresIn: 30,
			},
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", true);

		expect(response.cookies["userToken"].value).toBe("FOOBAR");
		expect(response.cookies["userToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: undefined,
			path: undefined,
			expires: expect.any(Date),
		});
	});

	// Test for setting the access token for anonymous users
	it("should set the access token for anonymous users", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", false);

		expect(response.cookies["guestToken"].value).toBe("FOOBAR");
		expect(response.cookies["guestToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			expires: undefined,
			domain: undefined,
			path: undefined,
		});
	});

	// Test for setting the refresh token for anonymous users
	it("should set the refresh token for anonymous users", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "none",
			refreshTokenPath: "/refresh",
			publicDomainFn: () => ".example.com",
		});

		cookieTokenSource.setRefreshToken(request, response, "FOOBAR", false);

		expect(response.cookies["refreshToken"].value).toBe("FOOBAR");
		expect(response.cookies["refreshToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			path: "/refresh",
			domain: ".example.com",
		});

		expect(response.cookies["guestRefreshTokenExists"].value).toBe("1");
		expect(response.cookies["guestRefreshTokenExists"].options).toStrictEqual({
			httpOnly: false,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			domain: ".example.com",
		});
	});

	// Test for setting the refresh token for authenticated users
	it("should set the refresh token for authenticated users", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "none",
			refreshTokenPath: "/refresh",
			publicDomainFn: () => ".example.com",
		});

		cookieTokenSource.setRefreshToken(request, response, "FOOBAR", true);

		expect(response.cookies["refreshToken"].value).toBe("FOOBAR");
		expect(response.cookies["refreshToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			path: "/refresh",
			domain: ".example.com",
		});

		expect(response.cookies["userRefreshTokenExists"].value).toBe("1");
		expect(response.cookies["userRefreshTokenExists"].options).toStrictEqual({
			httpOnly: false,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			domain: ".example.com",
		});
	});

	// Test for deleting access tokens
	it("should delete access tokens", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		// Mock setting some cookies
		request.cookies = {
			userToken: "USER_TOKEN",
			guestToken: "GUEST_TOKEN",
		};

		response.cookies = {
			userToken: { value: "USER_TOKEN", options: {} },
			guestToken: { value: "GUEST_TOKEN", options: {} },
		};

		cookieTokenSource.deleteAccessToken(request, response);

		expect(response.cookies).not.toHaveProperty("userToken");
		expect(response.cookies).not.toHaveProperty("guestToken");
	});

	// Test for deleting refresh tokens
	it("should delete refresh tokens", () => {
		const request = httpMocks.createRequest({
			cookies: {
				guestRefreshTokenExists: "1",
				userRefreshTokenExists: "1",
			},
		});
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
			publicDomainFn: () => ".example.com",
		});

		cookieTokenSource.deleteRefreshToken(request, response);

		expect(response.cookies).not.toHaveProperty("authRefreshToken");
		expect(response.cookies).not.toHaveProperty("guestRefreshTokenExists");
		expect(response.cookies).not.toHaveProperty("userRefreshTokenExists");
	});

	// Test for deleting refresh token by name
	it("should delete refresh token by name", () => {
		const response = createMockResponse();
		const request = httpMocks.createRequest();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		// Mock setting a refresh token
		response.cookies = {
			refreshToken: { value: "REFRESH_TOKEN", options: {} },
		};

		cookieTokenSource.deleteRefreshToken(request, response);

		expect(response.cookies).not.toHaveProperty("authRefreshToken");
	});
});
