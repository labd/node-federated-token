import { Request, Response } from "express";
import { TokenSource } from "./base";

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
