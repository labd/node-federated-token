---
"@labdigital/federated-token": minor
---

improves security by throwing an error if token fingerprint cookie is not present. Also optionally removes the \_\_host prefix from the fingerprint cookie, to allow for a fingerprint on path level, thereby enbaling authentication flows per path.
