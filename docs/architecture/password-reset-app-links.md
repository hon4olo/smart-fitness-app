# Password Reset App and Universal Links

## Status

The mobile source boundary for password-reset links is prepared without selecting
or activating a production domain.

The fixed application route is:

```text
/auth/reset-password
```

The mobile build and backend delivery composition use the same non-secret build
setting name:

```text
PASSWORD_RESET_APP_LINK_BASE_URL
```

A later approved environment must provide one exact value shaped like:

```text
https://<owned-link-domain>/auth/reset-password
```

No domain, DNS record, association file, EAS environment value, native build,
physical-device validation, real email, backend deployment, or password-reset
capability activation is included in this source slice.

## Fail-closed configuration

`app.config.ts` applies native link configuration only when
`PASSWORD_RESET_APP_LINK_BASE_URL` is present and valid. An absent or blank value
preserves the current safe configuration without an iOS associated-domain
entitlement or Android HTTPS intent filter.

A configured value is rejected unless it has all of these properties:

- `https` scheme;
- DNS hostname with at least two labels;
- no IP address, localhost, user information, or explicit port;
- exact `/auth/reset-password` path;
- no trailing slash, query, or fragment.

The raw invalid value is not included in the thrown configuration error.

## Native source configuration

For a valid configured hostname, the dynamic Expo config adds:

- iOS `associatedDomains`: `applinks:<hostname>`;
- Android `VIEW` intent filter with `autoVerify: true`;
- Android `https` scheme, exact hostname, and
  `pathPrefix: /auth/reset-password`;
- Android `BROWSABLE` and `DEFAULT` categories.

Existing associated domains and intent filters are preserved. Repeated config
evaluation is idempotent.

Expo Router maps the verified HTTPS path to the existing
`src/app/auth/reset-password.tsx` route. The existing custom
`smartfitnessapp://` scheme remains available for development diagnostics, but
production email delivery must use the verified HTTPS route.

## Token and navigation boundary

The backend creates a 32-byte base64url token, which is exactly 43 URL-safe
characters. Mobile accepts one and only one query parameter matching:

```text
[A-Za-z0-9_-]{43}
```

Mobile rejects missing, duplicate, short, long, padded, or non-base64url token
material before issuing a reset request. It never selects the first value from a
duplicate query parameter.

The route removes the `token` search parameter from navigation state after:

- malformed or duplicate input;
- a terminal invalid, expired, consumed, or conflicting reset response;
- successful password reset.

The token remains outside ordinary persisted application state, logs,
diagnostics, analytics, and user-visible copy. Invalid links show localized
recovery actions for requesting a new link or returning to sign-in.

## External iOS association

The owned link domain must serve an Apple App Site Association file over HTTPS at
one of Apple's supported locations. Its application identifier must match the
final Apple team ID plus:

```text
com.dzahard28.smartfitnessapp
```

The association must allow only `/auth/reset-password` and must not grant a broad
wildcard path. Domain ownership, Apple team identity, hosting, deployment, and
verification remain external.

## External Android association

The owned link domain must serve `/.well-known/assetlinks.json` over HTTPS. The
statement must reference:

```text
com.dzahard28.smartfitnessapp
```

and the SHA-256 signing certificate fingerprints for the exact build channel.
Package signing identity, association hosting, domain verification, and device
verification remain external.

## Validation boundary

Deterministic source tests cover:

- safe absence of build configuration;
- exact accepted HTTPS host and path;
- rejection of broad or unsafe origins and routes;
- exact iOS and Android source output;
- idempotent config evaluation;
- exact token length and alphabet;
- missing, malformed, and duplicate token handling;
- terminal token-rejection classification without provider or backend detail
  disclosure.

Blocking Mobile CI, Expo export, and Expo Doctor validate this source slice. A
new native build is still required before associated-domain or intent-filter
changes can exist on a device.
