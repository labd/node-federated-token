---
"@labdigital/federated-token-express-adapter": patch
---

Move `cookie` to a dev dependency. It was declared as a runtime dependency but is only used for a type in the tests, so it no longer gets installed for consumers.
