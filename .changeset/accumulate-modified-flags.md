---
"@labdigital/federated-token": patch
---

`deserializeAccessToken` with `trackModified` now accumulates the modified flags instead of replacing them. The gateway merges every subgraph response into the same token, so when a query plan made more than one fetch, a later response that handed back unchanged tokens reset `isAccessTokenModified()` and the new access token was never written to the client. The same applied to `isValueModified()` and the data token.
