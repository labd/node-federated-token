import { type CookieSerializeOptions, parse, serialize } from "cookie";
import { describe, expect, it } from "vitest";
import {
	type BaseCookieSourceOptions,
	BaseCookieTokenSource,
	type CookieAdapter,
} from "./cookies-base";

/**
 * A dummy implementation of the CookieAdapter interface for testing purposes.
 *
 * It is not really standards compliant, as the native Response API does not
 * support multiple Set-Cookie headers, so we just 'join' them with a comma.
 */
class TestAdapter implements CookieAdapter<Request, Response> {
	constructor(private options: BaseCookieSourceOptions) {}

	getCookie(request: Request, name: string): string | undefined {
		const header = request.headers.get("cookie");
		if (!header) return undefined;
		const cookies = parse(header);
		return cookies[name];
	}

	setCookie(
		request: Request,
		response: Response,
		name: string,
		value: string,
		options: CookieSerializeOptions
	): void {
		const cookieStr = serialize(name, value, options);
		response.headers.append("Set-Cookie", cookieStr);
	}

	clearCookie(
		request: Request,
		response: Response,
		name: string,
		options?: CookieSerializeOptions
	): void {
		const cookieStr = serialize(name, "", options);
		response.headers.append("Set-Cookie", cookieStr);
	}

	getPublicDomain(request: Request): string | undefined {
		return undefined;
	}

	getPrivateDomain(request: Request): string | undefined {
		return undefined;
	}
}

class TestCookieTokenSource extends BaseCookieTokenSource<Request, Response> {
	protected adapter: CookieAdapter<Request, Response>;

	constructor(options: BaseCookieSourceOptions) {
		super(options);
		this.adapter = new TestAdapter(options);
	}
}

const getCookies = (response: Response): Record<string, string>[] => {
	const raw = response.headers.get("Set-Cookie");
	if (!raw) return [];

	// split on commas before a new “key=”
	const parts = raw.split(/,\s*(?=[^;]+=)/);

	return parts.map((str) => parse(str));
};

describe("CookieTokenSource", () => {
	// Test for default cookie names
	it("should use default cookie names", () => {
		const cookieTokenSource = new TestCookieTokenSource({
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
		const cookieTokenSource = new TestCookieTokenSource({
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
		const request: Request = new Request("http://localhost", {
			headers: {
				cookie: "userToken=USER_TOKEN",
			},
		});

		const cookieTokenSource = new TestCookieTokenSource({
			secure: false,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		const result = cookieTokenSource.getAccessToken(request);
		expect(result).toBe("USER_TOKEN");
	});

	// Test for setting the access token for authenticated users
	it("should set the access token for authenticated users", async () => {
		const request: Request = new Request("http://localhost");
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", true);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([
			{ userToken: "FOOBAR", Path: "/", SameSite: "Strict" },
		]);
	});

	// Test for setting the access token for authenticated users
	it("should set the access token for authenticated users with custom expire", () => {
		const request: Request = new Request("http://localhost");
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
			userToken: {
				expiresIn: 30,
			},
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", true);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([
			{
				userToken: "FOOBAR",
				Path: "/",
				SameSite: "Strict",
				Expires: expect.any(String),
			},
		]);
	});

	// Test for setting the access token for anonymous users
	it("should set the access token for anonymous users", () => {
		const request: Request = new Request("http://localhost");
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setAccessToken(request, response, "FOOBAR", false);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([
			{ guestToken: "FOOBAR", Path: "/", SameSite: "Strict" },
		]);
	});

	// Test for setting the refresh token for anonymous users
	it("should set the refresh token for anonymous users", () => {
		const request: Request = new Request("http://localhost");
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "none",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setRefreshToken(request, response, "FOOBAR", false);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([
			{
				refreshToken: "FOOBAR",
				Path: "/refresh",
				SameSite: "None",
				Expires: expect.any(String),
			},
			{
				guestRefreshTokenExists: "1",
				SameSite: "None",
				Expires: expect.any(String),
			},
		]);
	});

	// Test for setting the refresh token for authenticated users
	it("should set the refresh token for authenticated users", () => {
		const request: Request = new Request("http://localhost");
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "none",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.setRefreshToken(request, response, "FOOBAR", true);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([
			{
				refreshToken: "FOOBAR",
				Path: "/refresh",
				SameSite: "None",
				Expires: expect.any(String),
			},
			{
				userRefreshTokenExists: "1",
				SameSite: "None",
				Expires: expect.any(String),
			},
		]);
	});

	// Test for deleting access tokens
	it("should delete access tokens", () => {
		const request: Request = new Request("http://localhost", {
			headers: {
				cookie: "userToken=USER_TOKEN; guestToken=GUEST_TOKEN",
			},
		});
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.deleteAccessToken(request, response);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([{ userToken: "" }, { guestToken: "" }]);
	});

	// Test for deleting refresh tokens
	it("should delete refresh tokens", () => {
		const request: Request = new Request("http://localhost", {
			headers: {
				cookie: "guestRefreshTokenExists=1; userRefreshTokenExists=1",
			},
		});
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.deleteRefreshToken(request, response);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([
			{ refreshToken: "", Path: "/refresh" },
			{ guestRefreshTokenExists: "" },
			{ userRefreshTokenExists: "" },
		]);
	});

	// Test for deleting refresh token by name
	it("should delete refresh token by name", () => {
		const request: Request = new Request("http://localhost", {
			headers: {
				cookie: "REFRESH_TOKEN=1"
			},
		});
		const response: Response = new Response();

		const cookieTokenSource = new TestCookieTokenSource({
			secure: true,
			sameSite: "strict",
			refreshTokenPath: "/refresh",
		});

		cookieTokenSource.deleteRefreshToken(request, response);

		const cookies = getCookies(response);
		expect(cookies).toStrictEqual([
			{ refreshToken: "", Path: "/refresh" },
		]);
	});
});
