# Backend Architecture 1.0 — Future Architecture

Non-implemented service map for later backend expansion.

## Service split

### AI Service

Responsibilities:

- training insights
- workout suggestions
- nutrition assistance
- natural-language summaries
- future coach workflows

Notes:
- Must not own canonical user records.
- Should read from domain APIs or analytics outputs, not raw mobile state.

### Notification Service

Responsibilities:

- push notifications
- reminder scheduling
- streak nudges
- sync alerts
- conflict follow-ups

Notes:
- Should consume events rather than poll domain tables directly.

### Analytics Service

Responsibilities:

- aggregations
- retention reporting
- habit tracking
- usage trends
- anonymized product metrics

Notes:
- Should prefer event streams or read replicas.
- Should not sit on the critical path for writes.

### Media Storage

Responsibilities:

- image uploads
- progress photos
- attachments
- future coach/media assets

Notes:
- Keep binary data out of the main relational path.
- Use signed URLs or equivalent in a later implementation.

### Community Service

Responsibilities:

- user-to-user interaction
- shared programs
- comments and reactions
- challenges and groups

Notes:
- This is intentionally isolated from the MVP backend.
- It should not affect the core sync model.

## Integration model

Future services should integrate through events and API contracts, not through direct shared database writes.

Preferred patterns:

- event emission from the core domain
- asynchronous consumers
- read models for specialized workloads
- explicit versioned contracts between services

## Service boundaries

The core backend should remain the source of truth for:

- user identity
- device identity
- sync revision history
- program ownership
- workout and nutrition history
- conflict records

Peripheral services should only enrich or notify; they should not mutate canonical fitness history without going through the core API.

## Expansion order

Recommended order after the core backend is stable:

1. Notification Service
2. Analytics Service
3. Media Storage
4. AI Service
5. Community Service

## Non-goals for this phase

- no service mesh design
- no deployment topology
- no queue broker selection
- no data warehouse design
- no ML infra details
