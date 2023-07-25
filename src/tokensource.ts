import { CookieOptions, Request, Response } from "express";

export interface TokenSource {
  getAccessToken(request: Request): string;
  getRefreshToken(request: Request): string;
  getFingerprint(request: Request): string;
  setAccessToken(response: Response, token: string): void;
  setRefreshToken(response: Response, token: string): void;
  setFingerprint(response: Response, fingerprint: string): void;
}

export class CompositeTokenSource implements TokenSource {
  private sources: TokenSource[];

  constructor(sources: TokenSource[]) {
    this.sources = sources;
  }

  getAccessToken(request: Request): string {
    for (const source of this.sources) {
      const token = source.getAccessToken(request);
      if (token) {
        return token;
      }
    }
    return "";
  }

  getRefreshToken(request: Request): string {
    for (const source of this.sources) {
      const token = source.getRefreshToken(request);
      if (token) {
        return token;
      }
    }
    return "";
  }

  getFingerprint(request: Request): string {
    for (const source of this.sources) {
      const token = source.getFingerprint(request);
      if (token) {
        return token;
      }
    }
    return "";
  }

  setAccessToken(response: Response, token: string) {
    for (const source of this.sources) {
      source.setAccessToken(response, token);
    }
  }

  setRefreshToken(response: Response, token: string) {
    for (const source of this.sources) {
      source.setRefreshToken(response, token);
    }
  }

  setFingerprint(response: Response, fingerprint: string) {
    for (const source of this.sources) {
      source.setFingerprint(response, fingerprint);
    }
  }
}

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
    accessTokenFingerprint: "authTokenHash",
    refreshToken: "authRefreshToken",
    refreshTokenExist: "authRefreshTokenExist",
  };

  getAccessToken(request: Request): string {
    return request.cookies[this.cookieNames.accessToken];
  }

  getRefreshToken(request: Request): string {
    return request.cookies[this.cookieNames.refreshToken];
  }

  getFingerprint(request: Request): string {
    return request.cookies[this.cookieNames.accessTokenFingerprint];
  }

  setAccessToken(response: Response, token: string) {
    response.cookie(this.cookieNames.accessToken, token, {
      httpOnly: false,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
    });
  }

  setRefreshToken(response: Response, token: string) {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
    response.cookie(this.cookieNames.refreshToken, token, {
      httpOnly: true,
      path: this.options.refreshTokenPath,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
      expires: expiresAt,
    });

    response.cookie(this.cookieNames.refreshTokenExist, "1", {
      httpOnly: false,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
      expires: expiresAt,
    });
  }

  setFingerprint(response: Response, fingerprint: string) {
    response.cookie(this.cookieNames.accessTokenFingerprint, fingerprint, {
      path: "/graphql",
      httpOnly: true,
      secure: this.options.secure,
      sameSite: this.options.sameSite,
    });
  }
}

export class HeaderTokenSource implements TokenSource {
  headerNames = {
    accessToken: "x-access-token",
    refreshToken: "x-refresh-token",
  }

  getAccessToken(request: Request): string {
    const authHeader = request.headers[this.headerNames.accessToken] as string;
    return authHeader?.replace("Bearer ", "");
  }

  getRefreshToken(request: Request): string {
    return request.headers[this.headerNames.refreshToken] as string;
  }

  getFingerprint(request: Request): string {
    return "";
  }

  setAccessToken(response: Response, token: string) {
    response.set(this.headerNames.accessToken, token);
  }

  setRefreshToken(response: Response, token: string) {
    response.set(this.headerNames.refreshToken, token);
  }

  setFingerprint(response: Response, fingerprint: string) {}
}
