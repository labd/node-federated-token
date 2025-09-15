# Federated Token - React Provider

The package `@labdigital/federated-token-react` provides a React context provider
to manage the token state in a React application.

# Usage

Register the `AuthProvider` in your application. This will provide the token to
all components in the application.

```tsx
import {
	AuthProvider,
	AuthProviderProps,
} from "@labdigital/federated-token-react";

const authProviderProps: AuthProviderProps = {
	logoutMutation: JSON.stringify({
		query: "mutation { clearToken }",
	}),
	refreshTokenMutation: JSON.stringify({
		query: "mutation { refreshToken }",
	}),
	authEndpoint: `${clientApiHostname}/auth/graphql`,
};

return <AuthProvider options={authProviderProps}>{children}</AuthProvider>;
```

Use the token data

```tsx
import { useAuth } from '@labdigital/federated-token-react';

const { loading, isAuthenticated, values, refreshToken } = useAuth();

if (loading) {
	return <div>Loading...</div>;
}
return (
	<div>User is authenticated {isAuthenticated}</div>
	<div>Values: {values}</div>
)
```

## Manual Token Refresh with AbortSignal

You can manually refresh the token and optionally provide an AbortSignal for cancellation:

```tsx
import { useAuth } from '@labdigital/federated-token-react';

function MyComponent() {
	const { refreshToken } = useAuth();

	const handleRefresh = async () => {
		try {
			// Simple refresh (uses default 10s timeout)
			await refreshToken();
			console.log('Token refreshed successfully');
		} catch (error) {
			console.error('Token refresh failed:', error);
		}
	};

	const handleRefreshWithTimeout = async () => {
		try {
			// Use AbortSignal.timeout for clean timeout handling
			await refreshToken(AbortSignal.timeout(5000)); // 5 second timeout
			console.log('Token refreshed successfully');
		} catch (error) {
			if (error.name === 'AbortError') {
				console.error('Token refresh timed out');
			} else {
				console.error('Token refresh failed:', error);
			}
		}
	};

	const handleRefreshWithCancel = async () => {
		const controller = new AbortController();
		
		// Start the refresh
		const refreshPromise = refreshToken(controller.signal);
		
		// Cancel after 3 seconds if still pending
		setTimeout(() => {
			console.log('Cancelling refresh request...');
			controller.abort();
		}, 3000);

		try {
			await refreshPromise;
		} catch (error) {
			console.error('Refresh was cancelled or failed:', error);
		}
	};

	return (
		<div>
			<button onClick={handleRefresh}>Refresh Token</button>
			<button onClick={handleRefreshWithTimeout}>Refresh with 5s Timeout</button>
			<button onClick={handleRefreshWithCancel}>Refresh with Cancel</button>
		</div>
	);
}
```

## Configuration Options

The `AuthProvider` accepts the following options:

- `refreshTimeoutMs`: Default timeout in milliseconds for token refresh requests (default: 10000ms)
- `refreshHandler`: Custom function to handle token refresh with optional AbortSignal support
