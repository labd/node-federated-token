// Auth context for the site
"use client";
import { decodeJwt } from "jose";
import Cookie from "js-cookie";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

/**
 * Buffer time in seconds before token expiration.
 * Set to 5 minutes to allow ample time for token refresh before it becomes invalid.
 */
const TOKEN_VALID_BUFFER = 5 * 60;

type CookieNames = {
	guestData: string;
	userData: string;
	guestRefreshTokenExists: string;
	userRefreshTokenExists: string;
};

const DEFAULT_COOKIE_NAMES: CookieNames = {
	userData: "userData",
	guestData: "guestData",
	userRefreshTokenExists: "userRefreshTokenExists",
	guestRefreshTokenExists: "guestRefreshTokenExists",
};

export type TokenData = {
	exp: number;
	isAuthenticated: boolean;
	values: TokenValues;
};

// biome-ignore lint/suspicious/noExplicitAny: fixme
export type TokenValues = Record<string, any>;

type TokenPayload = {
	exp: number;
} & TokenValues;

type AuthContextType = {
	isAuthenticated: boolean;
	hasToken: boolean;
	values: TokenValues | null;
	loading: boolean;
	logout: () => Promise<void>;
	validateLocalToken: () => void;
	checkToken: () => Promise<void>;
	refreshToken: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type AuthProviderProps = {
	cookieNames?: CookieNames;
	logoutHandler?: () => void;
	refreshHandler?: () => Promise<boolean>;

	// Deprecated
	refreshTokenEndpoint?: string;
	refreshTokenMutation?: string;
	logoutEndpoint?: string;
	logoutMutation?: string;
};

/**
 * Provider that handles authentication state.
 *
 * @remarks
 * This component manages the client side authentication state and flow for the application.
 *
 * @flow
 * 1. Component Mount:
 *    - The `validateLocalToken` function is called.
 *    - It checks the local token without making a request.
 *    - The auth state is updated based on the local token.
 *
 * 2. Request Handling:
 *    - Before making a request, `checkToken` is called to verify token status with the server.
 *    - If the access token is expired or invalid:
 *      a. The server attempts to use the refresh token to obtain a new access token.
 *      b. If successful, a new access token is returned and the auth state is updated.
 *      c. If unsuccessful, the auth state is updated to unauthenticated.
 *    - The request is then made with the current token state.
 *    - The auth state is updated based on the server's response.
 *
 * @param props.apiHostname - api hostname used to fetch token status from the api
 */
export function AuthProvider({
	children,
	options,
}: {
	children: React.ReactNode;
	options: AuthProviderProps;
}) {
	const [authState, setAuthState] = useState<
		Omit<
			AuthContextType,
			"logout" | "validateLocalToken" | "checkToken" | "refreshToken"
		>
	>({
		isAuthenticated: false,
		hasToken: false,
		values: null,
		loading: true,
	});

	const cookieNames = DEFAULT_COOKIE_NAMES;

	const updateAuthState = useCallback((token?: TokenData) => {
		if (token?.isAuthenticated) {
			setAuthState({
				isAuthenticated: true,
				hasToken: true,
				values: token.values,
				loading: false,
			});
		} else {
			setAuthState({
				isAuthenticated: false,
				hasToken: Boolean(token),
				values: null,
				loading: false,
			});
		}
	}, []);

	/**
	 * All this does is validate the local token in the cookie, it will not do any
	 * request to the server.  This is best used right after a request so that we
	 * can check if the token is still valid afterwards.
	 *
	 * @remarks Valid use case is that the API does not accept the given cookie
	 * and empties it as a response
	 */
	const validateLocalToken = useCallback(() => {
		const token = checkLocalToken();
		updateAuthState(token);
	}, [updateAuthState]);

	/**
	 * Load initial token when mounting the application. Doesn't do any checks
	 * because we don't want to hammer the server when the user first loads the
	 * application
	 *
	 * It will get checked when the user makes a request.
	 */
	const loadToken = useCallback(() => {
		const token = getJWT();
		updateAuthState(token);
	}, [updateAuthState]);

	/**
	 * Checks the token status with the server.
	 *
	 * - If the access token is expired or invalid, the server attempts to use the refresh token to obtain a new access token.
	 * - If successful, a new access token is returned and the auth state is updated.
	 * - If unsuccessful, the auth state is updated to unauthenticated.
	 */
	// biome-ignore lint/correctness/useExhaustiveDependencies: fixme
	const checkToken = useCallback(async () => {
		const token = await getAccessToken();
		updateAuthState(token);
	}, [options.refreshTokenEndpoint, updateAuthState]);

	// Load initial auth state when mounting the application
	useEffect(() => {
		loadToken();
	}, [loadToken]);

	/**
	 * Log out the user
	 *
	 * @throws {Error} If the COOKIE_DOMAIN environment variable is not set. Catch
	 * this function and handle it in the UI.
	 */
	const logout = async () => {
		setAuthState({
			isAuthenticated: false,
			hasToken: false,
			values: null,
			loading: false,
		});

		await clearTokens();

		validateLocalToken();
	};

	/**
	 * Checks the local JWT token stored in cookies.
	 *
	 * This function retrieves the JWT token using the getJWT function and validates its expiration.
	 * It ensures that the token is still valid for at least 5 more minutes.
	 *
	 * @returns {Token | undefined} The decoded token if it's valid, or undefined if the token is expired or doesn't exist.
	 *
	 * @example
	 * const token = checkLocalToken();
	 * if (token) {
	 *   console.log('User is authenticated:', token.authenticated);
	 * } else {
	 *   console.log('Token is expired or not present');
	 * }
	 */
	const checkLocalToken = (): TokenData | undefined => {
		const token = getJWT();

		if (!token) {
			return undefined;
		}

		return checkTokenValidity(token) ? token : undefined;
	};

	/**
	 * Checks if the token is still valid for at least 5 more minutes.
	 *
	 * @param token The JWT token to check.
	 * @returns {boolean} True if the token is still valid, false otherwise.
	 */
	const checkTokenValidity = (token: TokenData): boolean => {
		// Get the current time in seconds
		const timeSec = Math.floor(Date.now() / 1000);

		return Boolean(token?.exp && token.exp - TOKEN_VALID_BUFFER > timeSec);
	};

	const getJWT = (): TokenData | undefined => {
		const userToken = Cookie.get(cookieNames.userData);

		const extractValues = (tokenPayload: TokenPayload) => {
			const skipKeys = ["exp"];
			return Object.keys(tokenPayload).reduce(
				(acc, key) =>
					// biome-ignore lint/performance/noAccumulatingSpread: fixme
					skipKeys.includes(key) ? acc : { ...acc, [key]: tokenPayload[key] },
				{},
			);
		};
		if (userToken) {
			const tokenPayload = decodeToken(userToken);

			if (tokenPayload) {
				if (tokenPayload) {
					return {
						exp: tokenPayload.exp,
						isAuthenticated: true,
						values: extractValues(tokenPayload),
					};
				}
			}
		}

		const guestToken = Cookie.get(cookieNames.guestData);
		if (guestToken) {
			const tokenPayload = decodeToken(guestToken);
			if (tokenPayload) {
				return {
					exp: tokenPayload.exp,
					isAuthenticated: false,
					values: extractValues(tokenPayload),
				};
			}
		}
	};

	const getAccessToken = async (): Promise<TokenData | undefined> => {
		const token = getJWT();

		// Check if the token is still valid for more than 5 minutes. The JWT times
		// are in seconds, so we need to convert the current time to seconds as well.
		const timeSec = Math.floor(Date.now() / 1000);
		const buffer = 5 * 60;
		if (token?.exp && token.exp - buffer > timeSec) {
			return token;
		}

		// Do we have a refresh token? This can be either a user (authenticated) or
		// guest refresh token
		const hasRefreshToken =
			Cookie.get(cookieNames.userRefreshTokenExists) ??
			Cookie.get(cookieNames.guestRefreshTokenExists);
		if (hasRefreshToken) {
			const success = await refreshAccessToken();
			if (success) {
				return getJWT();
			}
		}

		// No token exists
		return undefined;
	};

	const refreshAccessToken = async (): Promise<boolean> => {
		if (options.refreshHandler) {
			return await options.refreshHandler();
		}

		if (!options.refreshTokenEndpoint || !options.refreshTokenMutation) {
			throw new Error("No refresh token endpoint or mutation provided");
		}

		// Since we are storing the refresh token in a cookie this will be sent
		// automatically by the browser.
		const response = await fetch(options.refreshTokenEndpoint, {
			method: "POST",
			body: options.refreshTokenMutation,
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error("Failed to refresh token");
		}

		const data = await response.json();
		if (!data) {
			throw new Error("Failed to refresh token");
		}

		// Check if there is a GraphQL error
		if (data.errors && data.errors.length > 0) {
			throw new Error("Failed to refresh token");
		}
		return true;
	};

	const clearTokens = async () => {
		if (options.logoutHandler) {
			await options.logoutHandler();
			return;
		}

		if (!options.logoutEndpoint || !options.logoutMutation) {
			throw new Error("No logout endpoint or mutation provided");
		}

		// Since we are storing the refresh token in a cookie this will be sent
		// automatically by the browser.
		const response = await fetch(options.logoutEndpoint, {
			method: "POST",
			body: options.logoutMutation,
			headers: {
				"Content-Type": "application/json",
			},
			credentials: "include",
		});
		if (!response.ok) {
			throw new Error(`Failed to clear token: ${response.statusText}`);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				...authState,
				logout,
				validateLocalToken,
				checkToken,
				refreshToken: refreshAccessToken,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

/**
 * Custom hook to access authentication context.
 *
 * @returns {Object} An object containing:
 *   - isAuthenticated: boolean indicating if the user is authenticated
 *   - values: object containing all values from the token
 *   - loading: boolean indicating if the authentication state is being loaded
 *   - logout: function to log out the current user
 *   - refreshToken: function to refresh the authentication token
 *
 * @throws {Error} If used outside of an AuthProvider
 *
 * @example
 * const { isAuthenticated, values, logout } = useAuth();
 *
 * if (isAuthenticated) {
 *   console.log(`Welcome, ${values.givenName}!`);
 * } else {
 *   console.log('Please log in.');
 * }
 */
export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

export const decodeToken = (token: string): TokenPayload | undefined => {
	const decodedToken = decodeJwt(token);
	if (
		!decodedToken ||
		!decodedToken.payload ||
		typeof decodedToken.payload === "string"
	) {
		return undefined;
	}
	return decodedToken.payload as TokenPayload;
};
