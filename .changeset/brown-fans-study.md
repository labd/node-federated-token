---
"@labdigital/federated-token-envelop": major
"@labdigital/federated-token-apollo": major
"@labdigital/federated-token-react": major
"@labdigital/federated-token": major
---

Refactor the package to allow for better support of both server-side and
client-side usage of the cookies. This includes distinquishing cookie names for
authenticated users versus guest users. Note that this is potentially a breaking
change for existing users.

Please refer to the README.md for more information on how to upgrade your
existing implementation.
