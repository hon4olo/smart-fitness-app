# Backend Architecture 1.0 — Database Design

Documentation-only relational schema for a future backend.

## Design goals

- Zero data loss
- Device-aware sync
- Append-only sync trail
- Soft deletes for user-owned data
- Simple ownership boundaries
- Indexes optimized for user + device + timestamp access patterns

## Shared conventions

### Common columns

Most tables should use:

- `id` — primary key, opaque string or UUID
- `user_id` — owner reference where applicable
- `created_at` — timestamp, required
- `updated_at` — timestamp, required on mutable rows
- `deleted_at` — nullable timestamp for soft deletes
- `synced_at` — nullable timestamp for local/cloud sync tracking when useful

### Soft delete policy

- User-owned records are soft-deleted.
- Delete operations set `deleted_at` instead of removing rows.
- Sync layers must retain tombstones long enough for downstream devices to observe deletions.
- Hard delete is reserved for security cleanup, legal requests, or token/session expiration data.

### Index policy

Minimum indexing principles:

- owner lookups: `(user_id, created_at DESC)`
- sync lookups: `(user_id, device_id, updated_at DESC)`
- active record queries: `(user_id, deleted_at)`
- foreign key indexes on all FK columns
- unique constraints on natural keys where needed, especially device identifiers and session identifiers

## Tables

## `users`

Represents application users.

- **PK**: `id`
- **Unique**: `email`
- **Indexes**: `email`, `created_at`
- **Columns**: profile fields, timezone, auth state, preferences
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

Foreign keys:
- none

Notes:
- A user may own many devices, sessions, programs, logs, conflicts, and sync operations.

## `devices`

Represents a physical client device registered to a user.

- **PK**: `id`
- **FK**: `user_id -> users.id`
- **Unique**: `(user_id, device_fingerprint)` or `(user_id, device_id)` depending on generation strategy
- **Indexes**: `user_id`, `last_seen_at`, `deleted_at`
- **Columns**: name, platform, fingerprint, push metadata, trust flags, last_seen_at
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

Notes:
- Device IDs should be stable across refreshes.
- Device registration is required before sync becomes active.

## `sessions`

Represents auth sessions / refresh-token sessions.

- **PK**: `id`
- **FKs**: `user_id -> users.id`, `device_id -> devices.id`
- **Unique**: `refresh_token_jti`
- **Indexes**: `user_id`, `device_id`, `expires_at`, `revoked_at`
- **Columns**: refresh token hash, access token metadata, IP, user agent, issued_at, expires_at, revoked_at, rotation counter
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

Notes:
- Session rows are usually revoked, not deleted.

## `sync_operations`

Append-only record of local or remote sync actions.

- **PK**: `id`
- **FKs**: `user_id -> users.id`, `device_id -> devices.id`, optional entity FKs when available
- **Indexes**: `(user_id, device_id, created_at DESC)`, `(user_id, entity_type, entity_id)`, `(sync_revision, created_at)`
- **Columns**: entity_type, entity_id, action, payload, revision, base_revision, status, retry_count, error_code, error_message, idempotency_key
- **Timestamps**: `created_at`, `updated_at`, `deleted_at` is optional; prefer retention over delete

Notes:
- This table is the audit trail for sync.
- Delete actions become tombstones in the payload trail.

## `workout_templates`

Represents reusable workout templates.

- **PK**: `id`
- **FK**: `user_id -> users.id`
- **Indexes**: `user_id`, `deleted_at`, `updated_at`
- **Columns**: name, description, template payload, difficulty, schedule metadata, program linkage
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

## `workout_sessions`

Represents completed or in-progress workout history.

- **PK**: `id`
- **FKs**: `user_id -> users.id`, optional `template_id -> workout_templates.id`, optional `device_id -> devices.id`
- **Indexes**: `user_id`, `started_at`, `completed_at`, `deleted_at`
- **Columns**: started_at, completed_at, exercises payload, notes, duration, source
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

## `food_entries`

Represents logged nutrition entries.

- **PK**: `id`
- **FKs**: `user_id -> users.id`, optional `device_id -> devices.id`
- **Indexes**: `user_id`, `consumed_at`, `deleted_at`
- **Columns**: consumed_at, meal label, quantities, macro summary, source, notes
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

## `nutrition_targets`

Represents user nutrition targets over time.

- **PK**: `id`
- **FK**: `user_id -> users.id`
- **Indexes**: `user_id`, `effective_from`, `deleted_at`
- **Columns**: calories, protein, carbs, fat, fiber, water, effective_from, effective_to
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

## `weight_history`

Represents body weight measurements over time.

- **PK**: `id`
- **FK**: `user_id -> users.id`
- **Indexes**: `user_id`, `measured_at`, `deleted_at`
- **Columns**: measured_at, value, unit, source, notes
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

## `body_measurements`

Represents circumference and other body metrics.

- **PK**: `id`
- **FK**: `user_id -> users.id`
- **Indexes**: `user_id`, `measured_at`, `deleted_at`
- **Columns**: measured_at, measurement_type, value, unit, side, source, notes
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

## `training_programs`

Represents structured training plans.

- **PK**: `id`
- **FK**: `user_id -> users.id`
- **Indexes**: `user_id`, `deleted_at`, `updated_at`
- **Columns**: name, goal, difficulty, duration_weeks, day_plan payload, progression payload, is_custom, metadata
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

Notes:
- Maps directly to the current `TrainingProgram` domain model.

## `exercise_catalog`

Represents reusable exercise definitions.

- **PK**: `id`
- **FKs**: optional `user_id -> users.id` for user-created entries, or nullable for global catalog entries
- **Indexes**: `name`, `user_id`, `deleted_at`
- **Columns**: name, aliases, muscles, equipment, difficulty, type, instructions, tips, metadata, source
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

Notes:
- This table supports both global and user-defined exercises.

## `food_catalog`

Represents reusable food definitions.

- **PK**: `id`
- **FKs**: optional `user_id -> users.id` for custom foods
- **Indexes**: `name`, `barcode`, `user_id`, `deleted_at`
- **Columns**: name, brand, barcode, serving size, nutrient profile, metadata, source
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

## `conflicts`

Represents sync conflicts requiring resolution or audit.

- **PK**: `id`
- **FKs**: `user_id -> users.id`, `device_id -> devices.id`, optional `sync_operation_id -> sync_operations.id`
- **Indexes**: `(user_id, status)`, `(user_id, detected_at DESC)`, `(entity_type, entity_id)`
- **Columns**: entity_type, entity_id, local_version, remote_version, base_version, status, resolution_strategy, resolved_version, reason, metadata
- **Timestamps**: `detected_at`, `resolved_at`, `created_at`, `updated_at`, `deleted_at`

## Referential integrity summary

- `users` is the root ownership table.
- `devices`, `sessions`, `sync_operations`, `workout_templates`, `workout_sessions`, `food_entries`, `nutrition_targets`, `weight_history`, `body_measurements`, `training_programs`, `exercise_catalog`, `food_catalog`, and `conflicts` should all trace back to `users`.
- `devices` should additionally trace to a user and be used in sync/audit records.
- `sync_operations` should reference the entity it describes through type + id, not only through a polymorphic hard FK.

## Partitioning / retention notes

- `sync_operations` and `sessions` are the most likely tables to need time-based retention later.
- User history tables should remain queryable for long-term progress analysis.
- Conflict and session records can be archived before user-owned history is archived.
