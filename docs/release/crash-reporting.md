# Crash reporting and source maps

Updated: 2026-07-25

This document defines the privacy and release contract for mobile crash reporting. The implementation uses Sentry through `@sentry/react-native` and the Expo config plugin.

## Release boundary

Sentry is a native runtime dependency. The first release containing it requires:

1. a new compatible iOS and Android native build;
2. a runtime/app-version boundary that prevents Sentry-importing JavaScript from reaching older binaries;
3. device validation before any production OTA promotion.

Do not publish this change as an OTA-only release to the existing `1.0.1` runtime.

## Required environment values

Configure these in the appropriate EAS environments rather than committing them:

- `EXPO_PUBLIC_SENTRY_DSN`: public project DSN used by the runtime SDK;
- `SENTRY_AUTH_TOKEN`: secret token used only by build/update tooling to upload source maps;
- `SENTRY_ORG`: Sentry organization slug used by the Expo plugin/tooling;
- `SENTRY_PROJECT`: Sentry project slug used by the Expo plugin/tooling;
- `EXPO_PUBLIC_GIT_COMMIT_SHA`: optional release commit identifier injected by the release workflow;
- `EXPO_PUBLIC_APP_ENV`: optional environment name such as `preview` or `production`.

The auth token must never use an `EXPO_PUBLIC_*` name. The DSN is not an authentication secret, but it must still be managed through the release environment so preview and production projects cannot be confused.

## Privacy contract

Crash reports may contain only technical failure information:

- sanitized exception type and stack frames;
- application version and build number;
- Expo runtime version, channel, update ID, and embedded-update state;
- masked route pattern;
- sync status and inferred online/offline/unknown state;
- non-sensitive failure category;
- stable support identifier;
- optional Git commit.

The app removes or disables:

- Sentry user identity and default PII;
- request bodies and headers;
- breadcrumbs;
- arbitrary extra context;
- exception messages;
- stack-frame local variables and absolute local paths;
- device-assigned names;
- session replay, screenshots, and performance tracing;
- email, tokens, passwords, health values, food names, exercise values, Coach prompts, and Coach responses.

Operational failures must be reported with a fixed safe error name/category. Do not pass raw backend, persistence, auth, sync, or provider messages to Sentry.

## Native build source maps

When `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are present in the EAS build environment, the Sentry Expo plugin can upload native-build source maps during the build.

Before promoting a native build:

```bash
npx expo-doctor
npx eas-cli@latest build --platform ios --profile production-internal
```

Repeat for Android before an Android rollout. Confirm in Sentry that a deliberately generated non-sensitive test error resolves to application source rather than only bundle offsets.

## EAS Update source maps

The repository provides:

```bash
npm run sentry:upload-sourcemaps
```

After publishing an explicitly approved update, upload the generated `dist` source maps using the same EAS environment as the update:

```bash
npx eas-cli@latest update \
  --channel production \
  --environment production \
  --platform ios \
  --message "<release message>"

npx eas-cli@latest env:exec \
  --environment production \
  'npm run sentry:upload-sourcemaps'
```

Do not treat command success alone as proof. Verify that the exact update ID is visible in a sanitized test event and that its stack resolves correctly.

## Validation checklist

- [ ] Sentry project created with the intended data region and retention settings;
- [ ] production and preview environment values configured;
- [ ] new native runtime/app version selected;
- [ ] iOS and Android builds pass `expo-doctor` and native compilation;
- [ ] no report is sent when the DSN is absent or while `__DEV__` is true;
- [ ] a fatal render error shows the recovery UI and support code;
- [ ] retry and application restart paths work;
- [ ] route identifiers are masked;
- [ ] sync and persistence failures contain categories only, not raw messages;
- [ ] source maps resolve for a native build and an EAS Update;
- [ ] event payload inspection confirms the privacy contract;
- [ ] preview rollout and rollback are completed before production promotion.

## Rollback

If crash rate or startup failures increase after release:

1. stop the rollout;
2. roll back the update to the last verified compatible update group;
3. do not send Sentry-dependent JavaScript to a binary built before the Sentry runtime dependency;
4. preserve the failed update ID, runtime, commit, and support codes for diagnosis;
5. validate the rollback on a real device before resuming rollout.
