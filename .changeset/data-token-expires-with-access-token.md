---
"@labdigital/federated-token": minor
"@labdigital/federated-token-apollo": minor
---

The data token now expires with the earliest access token instead of after 90 days, and `GatewayAuthPlugin` re-signs it when the access token changes, so clients refresh on time. A session without a refresh token now ends for the client when its access token expires; use the new `dataTokenExpiry` option to set another expiry.
