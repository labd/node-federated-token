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

const { loading, isAuthenticated, values } = useAuth();

if (loading) {
	return <div>Loading...</div>;
}
return (
	<div>User is authenticated {isAuthenticated}</div>
	<div>Values: {values}</div>
)
```
