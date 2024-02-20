---
"@labdigital/federated-token": patch
---

Check for values modified in deserializeAccessToken

When you only set a value in a service, the token did not get updated in the gateway.
This was because the valueModified was only set after a token change, not just a value change.
This changes improves the check to fix that.
