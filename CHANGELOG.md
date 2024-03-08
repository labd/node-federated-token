# @labdigital/federated-token

## 0.10.0

### Minor Changes

- b528dd5: Delete RefreshToken when a token is invalid (but not expired)
- 438e344: Throw TokenInvalidError for invalid tokens

## 0.9.1

### Patch Changes

- 58ded5e: Check for values modified in deserializeAccessToken

  When you only set a value in a service, the token did not get updated in the gateway.
  This was because the valueModified was only set after a token change, not just a value change.
  This changes improves the check to fix that.

## 0.9.0

### Minor Changes

- 280da10: Improve cookie security settings by using \_\_Host- where needed

## 0.8.1

### Patch Changes

- 3df5163: Don't use a async call for getSubject

## 0.8.0

### Minor Changes

- 1d2b7b3: Make the serialization of tokens more robust
- c2020cd: Add ability to set a jwt subject

## 0.7.0

### Minor Changes

- 645d0e3: Added support for setting values on token

## 0.6.2

### Patch Changes

- cfde937: Fix issues when running with bun by converting KeyObject to uint8

## 0.6.1

### Patch Changes

- ad77b2a: Delete the access token cookie when the token is invalid

## 0.6.0

### Minor Changes

- 6248b79: Implement cookie domain options

## 0.5.2

### Patch Changes

- a7b27c2: Only add host prefix for strict same site

## 0.5.1

### Patch Changes

- 752d421: remove unused IIFE and CJS dist files

## 0.5.0

### Minor Changes

- eee2cd1: Use a generic for the FederatedGraphQLDataSource context

### Patch Changes

- eee2cd1: Fix peerDependencies range

## 0.4.0

### Minor Changes

- 910eced: Move to full ESM

## 0.3.3

### Patch Changes

- c9c16b9: Move dependencies to peer depdenencies

## 0.3.2

### Patch Changes

- 9dca6a8: Export PublicFederatedTokenContext type

## 0.3.1

### Patch Changes

- e604a1b: Fix exporting the KeyManager class

## 0.3.0

### Minor Changes

- 66b663e: Refactor the key handling by introducing a KeyManager object to handle one or
  multiple keys.

## 0.2.0

### Minor Changes

- 374194a: Refactor handling of public tokens

## 0.1.0

### Minor Changes

- ede342e: Only return refresh tokens if modified
- 5c1c1d9: Properly load the refresh token in the gateway if set

## 0.0.2

### Patch Changes

- c7f1159: Fix release by including dist files
