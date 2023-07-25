import {
  CompositeTokenSource,
  TokenSource,
  CookieTokenSource,
  HeaderTokenSource,
} from "./tokensource";
import httpMocks from "node-mocks-http";
import { describe, it, expect, vi } from "vitest";

// Mock tokens
const mockAccessToken = "mockAccessToken";
const mockRefreshToken = "mockRefreshToken";

describe("CompositeTokenSource", () => {
  // Helper function to create a mock TokenSource with empty implementations
  const createMockTokenSource = (): TokenSource => ({
    getAccessToken: vi.fn().mockReturnValue(""),
    getRefreshToken: vi.fn().mockReturnValue(""),
    getFingerprint: vi.fn().mockReturnValue(""),
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setFingerprint: vi.fn(),
  });

  it("should get the access token from the first source that provides one", () => {
    const mockTokenSource1 = createMockTokenSource();
    const mockTokenSource2 = createMockTokenSource();
    mockTokenSource2.getAccessToken = vi.fn().mockReturnValue(mockAccessToken);

    const request = httpMocks.createRequest();
    const compositeTokenSource = new CompositeTokenSource([
      mockTokenSource1,
      mockTokenSource2,
    ]);
    const result = compositeTokenSource.getAccessToken(request);

    expect(result).toBe(mockAccessToken);
    expect(mockTokenSource1.getAccessToken).toHaveBeenCalled();
    expect(mockTokenSource2.getAccessToken).toHaveBeenCalled();
  });
});

describe("CookieTokenSource", () => {
  it("should get the access token from cookies", () => {
    const request = httpMocks.createRequest();
    request.cookies = { authToken: "FOOBAR" };

    const cookieTokenSource = new CookieTokenSource({
      secure: true,
      sameSite: "strict",
      refreshTokenPath: "/refresh",
    });
    const result = cookieTokenSource.getAccessToken(request);
    expect(result).toBe("FOOBAR");
  });

  it("should get the refresh token from cookies", () => {
    const request = httpMocks.createRequest();
    request.cookies = { authRefreshToken: "FOOBAR" };

    const cookieTokenSource = new CookieTokenSource({
      secure: true,
      sameSite: "strict",
      refreshTokenPath: "/refresh",
    });
    const result = cookieTokenSource.getRefreshToken(request);
    expect(result).toBe("FOOBAR");
  });
});

describe("HeaderTokenSource", () => {
  it("should get the access token from headers", () => {
    const headerTokenSource = new HeaderTokenSource();
    const request = httpMocks.createRequest({
      headers: { "x-access-token": `Bearer FOOBAR` },
    });
    const result = headerTokenSource.getAccessToken(request);
    expect(result).toBe("FOOBAR");
  });

  it("should get the refresh token from headers", () => {
    const headerTokenSource = new HeaderTokenSource();
    const request = httpMocks.createRequest({
      headers: {
        "x-refresh-token": mockRefreshToken,
      },
    });
    const result = headerTokenSource.getRefreshToken(request);

    expect(result).toBe(mockRefreshToken);
  });

  it("should return an undefined value if access token is missing from headers", () => {
    const headerTokenSource = new HeaderTokenSource();
    const request = httpMocks.createRequest();
    const result = headerTokenSource.getAccessToken(request);
    expect(result).toBeUndefined();
  });

  it("should set the access token in the response headers", () => {
    const response = httpMocks.createResponse();
    const headerTokenSource = new HeaderTokenSource();
    headerTokenSource.setAccessToken(response, "foobar");
    expect(response.get("x-access-token")).toBe("foobar");
  });

  it("should set the refresh token in the response headers", () => {
    const response = httpMocks.createResponse();
    const headerTokenSource = new HeaderTokenSource();
    headerTokenSource.setRefreshToken(response, "foobar");
    expect(response.get("x-refresh-token")).toBe("foobar");
  });

  it("should not set the fingerprint in the response headers", () => {
    const response = httpMocks.createResponse();
    const headerTokenSource = new HeaderTokenSource();
    headerTokenSource.setFingerprint(response, "mockFingerprint");

    expect(response.getHeaders()).toStrictEqual({});
  });
});
