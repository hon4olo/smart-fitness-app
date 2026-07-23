# Pre-workout Safety & Recovery gate

The workout session route now displays a deterministic acknowledgement screen before opening a newly created or previously unacknowledged session.

## Source review

A terminal `safety_recovery_review` result is saved locally as an account-scoped snapshot. The snapshot includes only structured readiness fields, restrictions and findings. Free-text limitation and recovery notes are excluded from the source fingerprint.

The saved review is marked stale when:

- structured recovery check-in data changes;
- structured limitation data changes;
- the reviewed latest check-in becomes older than 72 hours.

## Session acknowledgement

The gate is acknowledged once per workout-session draft. Resuming the same draft does not repeat the acknowledgement.

A current `ready` result can continue without an extra checkbox. `modify`, `blocked`, `needs_input`, missing and stale review states require an explicit acknowledgement. The app does not automatically change exercises, sets, repetitions or load.

This is product safety context based on synchronized self-reported data. It is not a medical diagnosis or treatment recommendation.
