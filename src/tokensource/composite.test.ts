import { TokenSource } from "./base";
import httpMocks from "node-mocks-http";
import { describe, it, expect, vi } from "vitest";
import { CompositeTokenSource } from "./composite";

// Mock tokens
const mockAccessToken = "mockAccessToken";

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
