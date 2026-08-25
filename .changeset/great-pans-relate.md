---
"@labdigital/federated-token": patch
---

Replace the remaining `any` types in the JWT payload and `TokenSigner.encryptObject` with `unknown`. Callers passing an object are unaffected.
