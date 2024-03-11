import httpMocks from "node-mocks-http";
import { describe, it, expect } from "vitest";
import { CookieTokenSource } from "./cookies";
import { CookieSerializeOptions } from "cookie";

const createMockResponse = () => {
	const res = httpMocks.createResponse();

	// @ts-ignore
	res.cookie = (
		name: string,
		value: string,
		options: CookieSerializeOptions
	) => {
		res.cookies = res.cookies || {};
		res.cookies[name] = { value, options };
		return res;
	};
	return res;
};

describe("CookieTokenSource", () => {

	it("should use default cookie names", () => {
		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		const result = cookieTokenSource['cookieNames']
		expect(result).toStrictEqual({
			accessToken: "authToken",
			accessTokenHash: "authTokenHash",
			refreshToken: "authRefreshToken",
			refreshTokenExist: "authRefreshTokenExist",
		});
	});

	it("should override cookie names", () => {
		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
			cookieNames: {
				accessToken: 'accessToken-overridden',
				accessTokenHash: 'accessTokenHash-overridden',
				refreshToken: 'refreshToken-overridden',
				refreshTokenExist: 'refreshTokenExist-overridden'
			}
		});

		const result = cookieTokenSource['cookieNames']
		expect(result).toStrictEqual({
			accessToken: 'accessToken-overridden',
			accessTokenHash: 'accessTokenHash-overridden',
			refreshToken: 'refreshToken-overridden',
			refreshTokenExist: 'refreshTokenExist-overridden'
		});
	});

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
			cookies: { authRefreshToken: "FOOBAR" },
		});

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});
		const result = cookieTokenSource.getRefreshToken(request);
		expect(result).toBe("FOOBAR");
	});

	it("should set the access token in cookies", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR");

		expect(Object.values(response.cookies)).toHaveLength(1);

		expect(response.cookies["authToken"].value).toBe("FOOBAR");
		expect(response.cookies["authToken"].options).toStrictEqual({
			domain: undefined,
			httpOnly: false,
			sameSite: "strict",
			secure: false,
		});
	});

	it("should set the access token fingerprint in cookies (secure)", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setFingerprint(request, response, "FOOBAR");

		expect(Object.values(response.cookies)).toHaveLength(1);

		expect(response.cookies["__Host-authTokenHash"].value).toBe("FOOBAR");
		expect(response.cookies["__Host-authTokenHash"].options).toStrictEqual({
			domain: undefined,
			httpOnly: true,
			sameSite: "strict",
			secure: true,
		});
	});

	it("should set the access token fingerprint in cookies (insecure)", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setFingerprint(request, response, "FOOBAR");

		expect(Object.values(response.cookies)).toHaveLength(1);

		expect(response.cookies["authTokenHash"].value).toBe("FOOBAR");
		expect(response.cookies["authTokenHash"].options).toStrictEqual({
			domain: undefined,
			httpOnly: true,
			sameSite: "strict",
			secure: false,
		});
	});

	it("should set the refresh token in cookies", () => {
		const request = httpMocks.createRequest();
		const response = createMockResponse();

		const cookieTokenSource = new CookieTokenSource({
			secure: true,
			sameSite: "none",
			refreshTokenPath: "/refresh",
			publicDomainFn: () => ".example.com",
		});

		cookieTokenSource.setRefreshToken(request, response, "FOOBAR");

		expect(Object.values(response.cookies)).toHaveLength(2);

		expect(response.cookies["authRefreshToken"].value).toBe("FOOBAR");
		expect(response.cookies["authRefreshToken"].options).toStrictEqual({
			domain: undefined,
			expires: expect.any(Date),
			httpOnly: true,
			path: "/refresh",
			sameSite: "none",
			secure: true,
		});

		expect(response.cookies["authRefreshTokenExist"].value).toBe("1");
		expect(response.cookies["authRefreshTokenExist"].options).toStrictEqual({
			domain: ".example.com",
			expires: expect.any(Date),
			httpOnly: false,
			sameSite: "none",
			secure: true,
		});
	});
});
