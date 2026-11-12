---
"@labdigital/federated-token": patch
---

Setting a user access token now clears a guest refresh token and its marker unless the request has a user refresh token, so a login without a refresh token of its own can no longer be refreshed into an anonymous session.
