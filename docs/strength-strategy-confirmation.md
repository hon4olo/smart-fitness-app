# Mobile Strength Strategy Confirmation

## Boundary

The mobile client never submits proposed exercises, sets, loads, repetitions or RPE values during confirmation. It sends only the persisted Coach run ID in the URL and a fresh idempotency key in the request body.

## Capability rollout

- Capability v1-v2: no Strength Strategy UI.
- Capability v3: Strength Strategy preview only.
- Capability v4: preview plus explicit template confirmation when `strength.structuredStrategyConfirmation` is true.

## Confirmation flow

```text
validated preview
→ native confirmation alert
→ POST runId + idempotencyKey
→ strict applied-result parsing
→ ordinary sync pull
→ prescribed workout template appears locally
```

A confirmed strategy creates a new custom workout template. It does not edit the completed source workout session.

## Synced template data

The template snapshot preserves:

- unique exercise list;
- ordered prescription sets;
- source set IDs;
- weight, repetitions and target RPE;
- adjustment and rationale metadata;
- originating Coach run ID;
- source session ID;
- strategy type and confirmation timestamp.

Legacy custom templates remain valid with `prescription` and `coachMetadata` normalized to `null`.
