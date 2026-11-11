---
"@labdigital/federated-token": minor
"@labdigital/federated-token-apollo": minor
---

`GatewayAuthPlugin` keeps the values of an expired data token on a refresh request (one carrying a valid refresh token) and re-signs it, instead of dropping them. `loadDataJWT` gains an `allowExpired` option for this, and `TokenExpiredError` carries the verified `payload`.
