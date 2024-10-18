import httpMocks from "node-mocks-http";
import { describe, it, expect } from "vitest";
import { CookieTokenSource } from "./cookies";
import { CookieSerializeOptions } from "cookie";

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
			sessionData: "sessionData",
			userToken: "userToken",
			sessionToken: "sessionToken",
			userRefreshTokenExist: "userRefreshTokenExist",
			refreshToken: "authRefreshToken",
			refreshTokenExist: "authRefreshTokenExist",
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
				sessionData: "sessionData",
				userToken: "customUserToken",
				sessionToken: "customSessionToken",
				userRefreshTokenExist: "userRefreshTokenExist",
				refreshToken: "authRefreshToken",
				refreshTokenExist: "authRefreshTokenExist",
			},
		});

		const result = cookieTokenSource["cookieNames"];
		expect(result).toStrictEqual({
			userData: "userData",
			sessionData: "sessionData",
			userToken: "customUserToken",
			sessionToken: "customSessionToken",
			userRefreshTokenExist: "userRefreshTokenExist",
			refreshToken: "authRefreshToken",
			refreshTokenExist: "authRefreshTokenExist",
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

		expect(response.cookies["sessionToken"].value).toBe("FOOBAR");
		expect(response.cookies["sessionToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: undefined,
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

		expect(response.cookies["authRefreshToken"].value).toBe("FOOBAR");
		expect(response.cookies["authRefreshToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			path: "/refresh",
			domain: ".example.com",
		});

		expect(response.cookies["authRefreshTokenExist"].value).toBe("1");
		expect(response.cookies["authRefreshTokenExist"].options).toStrictEqual({
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

		expect(response.cookies["authRefreshToken"].value).toBe("FOOBAR");
		expect(response.cookies["authRefreshToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			path: "/refresh",
			domain: ".example.com",
		});

		expect(response.cookies["userRefreshTokenExist"].value).toBe("1");
		expect(response.cookies["userRefreshTokenExist"].options).toStrictEqual({
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
		response.cookies = {
			userToken: { value: "USER_TOKEN", options: {} },
			sessionToken: { value: "SESSION_TOKEN", options: {} },
		};

		cookieTokenSource.deleteAccessToken(request, response);

		expect(response.cookies).not.toHaveProperty("userToken");
		expect(response.cookies).not.toHaveProperty("sessionToken");
	});

	// Test for deleting refresh tokens
	it("should delete refresh tokens", () => {
		const request = httpMocks.createRequest({
			cookies: {
				authRefreshTokenExist: "1",
				userRefreshTokenExist: "1",
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
		expect(response.cookies).not.toHaveProperty("authRefreshTokenExist");
		expect(response.cookies).not.toHaveProperty("userRefreshTokenExist");
	});

	// Test for deleting refresh token by name
	it("should delete refresh token by name", () => {
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		// Mock setting a refresh token
		response.cookies = {
			authRefreshToken: { value: "REFRESH_TOKEN", options: {} },
		};

		cookieTokenSource.deleteRefreshTokenByName(response, "authRefreshToken");

		expect(response.cookies).not.toHaveProperty("authRefreshToken");
	});
});
