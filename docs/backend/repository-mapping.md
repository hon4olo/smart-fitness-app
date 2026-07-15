# Backend Architecture 1.0 — Repository Mapping

This document explains the intended flow from the current client architecture to a future cloud backend.

## Layer map

```text
AppContext
  ↓
Repository
  ↓
CloudProvider
  ↓
REST API
  ↓
Database
```

## Responsibilities

### AppContext

- Owns user-facing state in the client
- Exposes actions used by the UI
- Remains unaware of HTTP, auth headers, and persistence details
- Talks to repositories, not directly to the backend

### Repository

- Translates app intent into data operations
- Manages local state and local persistence
- Decides when to queue sync operations
- Keeps domain logic close to the app data model

### CloudProvider

- Defines the backend contract from the client perspective
- Handles sync-oriented operations such as push, pull, status, snapshot, and conflict resolution
- Remains transport-agnostic at the interface level
- Acts as the client-side boundary for future REST calls

### REST API

- Exposes versioned endpoints
- Accepts auth, sync, profile, and program requests
- Enforces server-side validation and authorization
- Returns normalized error envelopes and revision markers

### Database

- Stores authoritative user, device, session, sync, domain, and conflict records
- Enforces referential integrity
- Preserves history through soft deletes and sync tombstones

## Data ownership

### Client-owned concerns

- UI state
- form drafts
- optimistic edits
- offline queue ordering
- local cache shape

### Repository-owned concerns

- local persistence
- mapping between domain entities and storage shape
- queue management
- conflict staging

### CloudProvider-owned concerns

- server interaction contracts
- sync revision handling
- conflict payload shape
- bootstrap/pull/push semantics

### Server-owned concerns

- authentication
- authorization
- canonical persistence
- revision generation
- conflict detection and persistence

## Contract boundaries

The client should not assume:

- exact database schema
- token storage implementation
- server internals
- network retry behavior beyond the API contract

The backend should not assume:

- a specific mobile UI state model
- that a device is always online
- that local operations arrive in a single batch

## Domain mapping examples

- `TrainingProgram` → `training_programs`
- `Exercise` → `exercise_catalog`
- workout history → `workout_sessions`
- food log → `food_entries`
- weight timeline → `weight_history`
- body metrics → `body_measurements`
- sync queue items → `sync_operations`

## Extension rule

If a future implementation needs a new transport, the repository layer should stay stable and only the `CloudProvider` implementation should change.
