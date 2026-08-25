---
"@labdigital/federated-token": patch
"@labdigital/federated-token-apollo": patch
"@labdigital/federated-token-express-adapter": patch
"@labdigital/federated-token-fastify-adapter": patch
"@labdigital/federated-token-react": patch
"@labdigital/federated-token-yoga": patch
---

Build the packages with `tsdown` instead of `tsup`, and validate the published output with `publint` on every build.

The documented entry points are unchanged, but `dist/` now contains additional shared chunks next to them. Deep imports into `dist/` were never supported and may break.
