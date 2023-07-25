import { CookieOptions, Request, Response } from "express";
import { TokenSource } from "./base";

type CookieSourceOptions = {
  secure: boolean;
  sameSite: CookieOptions["sameSite"];
  refreshTokenPath: string;
};

/*
 * CookieTokenSource is a TokenSource that uses cookies to store the tokens. It
 * uses the following four cookies for storing the token securely by mixing
 * httpOnly and non-httpOnly cookies:
 *  - accessToken: The access token (non-httpOnly)
 *  - refreshToken: The refresh token (httpOnly)
 *  - refreshTokenExist: A flag to indicate that the refresh token exists (non-httpOnly)
 *  - accessTokenFingerprint: The fingerprint of the browser (httpOnly)
 */
export class CookieTokenSource implements TokenSource {
  constructor(private options: CookieSourceOptions) {}

  cookieNames = {
    accessToken: "authToken",
    accessTokenHash: "authTokenHash",
    refreshToken: "authRefreshToken",
    refreshTokenExist: "authRefreshTokenExist",
  };

  _getCookieName(name: string): string {
    if (this.options.secure) return `__Host-${name}`;
    return `${name}`;
  }

  _getCookie(request: Request, name: string) {
    return request.cookies[this._getCookieName(name)];
  }

  _setCookie(
    response: Response,
    name: string,
    value: string,
    options: CookieOptions
  ) {
    response.cookie(this._getCookieName(name), value, options);
  }

  getAccessToken(request: Request): string {
    return this._getCookie(request, this.cookieNames.accessToken);
  }

  getRefreshToken(request: Request): string {
    return this._getCookie(request, this.cookieNames.refreshToken);
  }

  getFingerprint(request: Request): string {
    return this._getCookie(request, this.cookieNames.accessTokenHash);
  }

  setAccessToken(response: Response, token: string) {
    this._setCookie(response, this.cookieNames.accessToken, token, {
      httpOnly: false,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
    });
  }

  setRefreshToken(response: Response, token: string) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
    this._setCookie(response, this.cookieNames.refreshToken, token, {
      httpOnly: true,
      path: this.options.refreshTokenPath,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
      expires: expiresAt,
    });

    this._setCookie(response, this.cookieNames.refreshTokenExist, "1", {
      httpOnly: false,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
      expires: expiresAt,
    });
  }

  setFingerprint(response: Response, fingerprint: string) {
    this._setCookie(response, this.cookieNames.accessTokenHash, fingerprint, {
      httpOnly: true,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
    });
  }
}
