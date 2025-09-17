import type { CookieSerializeOptions } from "@fastify/cookie";
import type { FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it, } from "vitest";
import { CookieTokenSource } from "./cookies";

type CookieValue = {
	value: string;
	options: CookieSerializeOptions;
};

const createMockRequest = (options: Record<string, unknown> = {}) => {
	return {
		cookies: {},
		...options,
	} as FastifyRequest;
};

type FastifyMockResponse = {
	_cookies: Record<string, CookieValue>;
};

// Mock a Fastify reply object
const createMockResponse = () => {
	const res: any = {
		_cookies: {} as Record<string, CookieValue>,
		setCookie(name: string, value: string, options: CookieSerializeOptions) {
			this._cookies[name] = {
				value,
				options: { ...options, secure: options.secure || false },
			};
			return this;
		},
		clearCookie(name: string, options?: CookieSerializeOptions) {
			delete this._cookies[name];
			return this;
		},
	};
	return res as FastifyReply & FastifyMockResponse;
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
		const request = createMockRequest({
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
		const request = createMockRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", true);

		expect(response._cookies["userToken"]?.value).toBe("FOOBAR");
		expect(response._cookies["userToken"]?.options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: undefined,
			expires: undefined,
			path: "/",
		});
	});

	it("should set the access token for authenticated users with custom expire", () => {
		const request = createMockRequest();
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

		expect(response._cookies["userToken"].value).toBe("FOOBAR");
		expect(response._cookies["userToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: undefined,
			path: "/",
			expires: expect.any(Date),
		});
	});

	// Test for setting the access token for anonymous users
	it("should set the access token for anonymous users", () => {
		const request = createMockRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", false);

		expect(response._cookies["guestToken"].value).toBe("FOOBAR");
		expect(response._cookies["guestToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "strict",
			domain: undefined,
			expires: undefined,
			path: "/",
		});
	});

	// Test for setting the refresh token for anonymous users
	it("should set the refresh token for anonymous users", () => {
		const request = createMockRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "none",
			refreshTokenPath: "/refresh",
			publicDomainFn: () => ".example.com",
		});

		cookieTokenSource.setRefreshToken(request, response, "FOOBAR", false);

		expect(response._cookies["refreshToken"].value).toBe("FOOBAR");
		expect(response._cookies["refreshToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			path: "/refresh",
			domain: ".example.com",
		});

		expect(response._cookies["guestRefreshTokenExists"].value).toBe("1");
		expect(response._cookies["guestRefreshTokenExists"].options).toStrictEqual({
			httpOnly: false,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			domain: ".example.com",
		});
	});

	// Test for setting the refresh token for authenticated users
	it("should set the refresh token for authenticated users", () => {
		const request = createMockRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "none",
			refreshTokenPath: "/refresh",
			publicDomainFn: () => ".example.com",
		});

		cookieTokenSource.setRefreshToken(request, response, "FOOBAR", true);

		expect(response._cookies["refreshToken"].value).toBe("FOOBAR");
		expect(response._cookies["refreshToken"].options).toStrictEqual({
			httpOnly: true,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			path: "/refresh",
			domain: ".example.com",
		});

		expect(response._cookies["userRefreshTokenExists"].value).toBe("1");
		expect(response._cookies["userRefreshTokenExists"].options).toStrictEqual({
			httpOnly: false,
			secure: true,
			sameSite: "none",
			expires: expect.any(Date),
			domain: ".example.com",
		});
	});

	// Test for deleting access tokens
	it("should delete access tokens", () => {
		const request = createMockRequest();
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

		response._cookies = {
			userToken: { value: "USER_TOKEN", options: {} },
			guestToken: { value: "GUEST_TOKEN", options: {} },
		};

		cookieTokenSource.deleteAccessToken(request, response);

		expect(response._cookies).not.toHaveProperty("userToken");
		expect(response._cookies).not.toHaveProperty("guestToken");
	});

	// Test for deleting refresh tokens
	it("should delete refresh tokens", () => {
		const request = createMockRequest({
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

		expect(response._cookies).not.toHaveProperty("authRefreshToken");
		expect(response._cookies).not.toHaveProperty("guestRefreshTokenExists");
		expect(response._cookies).not.toHaveProperty("userRefreshTokenExists");
	});

	// Test for deleting refresh token by name
	it("should delete refresh token by name", () => {
		const response = createMockResponse();
		const request = createMockRequest();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		// Mock setting a refresh token
		response._cookies = {
			refreshToken: { value: "REFRESH_TOKEN", options: {} },
		};

		cookieTokenSource.deleteRefreshToken(request, response);

		expect(response._cookies).not.toHaveProperty("authRefreshToken");
	});
});
