---
"@labdigital/federated-token": minor
---

Remove the `express` type dependency from the core package. `CompositeTokenSource` no longer defaults its `TRequest`/`TResponse` type parameters to the express `Request`/`Response` types, so the framework-agnostic core no longer leaks express types into its published type definitions.

Constructor calls such as `new CompositeTokenSource([cookieSource])` still infer both type parameters and need no change. Only code that referenced the bare type without arguments (for example `let source: CompositeTokenSource`) has to pass them explicitly now.
