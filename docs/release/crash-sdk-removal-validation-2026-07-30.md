# Crash-reporting SDK removal validation

Date: 2026-07-30

Validated source head: generated removal branch before final workflow-only cleanup.

## Removed

- third-party crash-reporting runtime dependency;
- Expo native plugin configuration;
- Metro integration;
- root initialization and context bridge;
- source-map upload command and environment override;
- provider-specific source files, tests, properties, and documentation.

## Retained

- the local root error boundary;
- retry and application-restart recovery actions;
- privacy-safe local support diagnostics;
- ordinary Expo Updates behavior.

## Dependency alignment

The same validated change aligns the required Expo SDK 56 patch versions:

- `expo` `~56.0.18`;
- `expo-router` `~56.2.17`;
- `@expo/ui` `~56.0.24`.

## Automated validation

The generated source change passed:

- `npx tsc --noEmit`;
- the full Vitest regression suite;
- `npx expo-doctor`;
- `npx expo export --clear`;
- a repository scan confirming that provider-specific references were absent outside historical project learnings and the two workflow files handled separately.

The final workflow-only cleanup removes the one-time automation and aligns the OTA runtime assertion with the working standalone runtime `1.0.3`. It does not publish an update or create a native build.
