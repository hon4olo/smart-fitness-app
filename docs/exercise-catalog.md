# Exercise Catalog Providers

The app defaults to the local exercise fixture in production builds.

Internal development or preview builds may enable the free OSS ExerciseDB provider with:

```sh
EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB=true
```

This flag is not a secret and is not an API key. It only selects the free hosted ExerciseDB V1 endpoint for internal testing.

Do not enable this flag for App Store production builds. The free OSS ExerciseDB media is for development, prototypes, and non-commercial testing; production profiles must set `EXPO_PUBLIC_ENABLE_OSS_EXERCISEDB=false` or omit the variable.

Exercise metadata cache keys are provider-specific:

- `exercise-cache:oss-exercisedb:v2`
- `exercise-cache:local:v1`
