import httpMocks from "node-mocks-http";
import { describe, expect, it, vi } from "vitest";
import { TokenSource } from "./base";
import { CompositeTokenSource } from "./composite";

// Mock tokens
const mockAccessToken = "mockAccessToken";

describe("CompositeTokenSource", () => {
	// Helper function to create a mock TokenSource with empty implementations
	const createMockTokenSource = (): TokenSource => ({
		getAccessToken: vi.fn().mockReturnValue(""),
		getRefreshToken: vi.fn().mockReturnValue(""),
		getDataToken: vi.fn().mockReturnValue(""),
		deleteAccessToken: vi.fn(),
		deleteRefreshToken: vi.fn(),
		setAccessToken: vi.fn(),
		setRefreshToken: vi.fn(),
		setDataToken: vi.fn(),
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
