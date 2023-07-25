import { Request, Response } from "express";

export interface TokenSource {
  getAccessToken(request: Request): string;
  getRefreshToken(request: Request): string;
  getFingerprint(request: Request): string;
  setAccessToken(response: Response, token: string): void;
  setRefreshToken(response: Response, token: string): void;
  setFingerprint(response: Response, fingerprint: string): void;
}
