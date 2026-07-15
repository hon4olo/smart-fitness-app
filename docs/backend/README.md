# Backend Architecture 1.0

Architecture-first contract for the future cloud backend of `smart-fitness-app`.

## Scope

- No HTTP implementation
- No auth implementation
- No database implementation
- No mobile app integration
- Documentation only

## Documents

- [API Contract](./api-contract.md)
- [Database Design](./database-design.md)
- [Sync Flow](./sync-flow.md)
- [Security](./security.md)
- [Repository Mapping](./repository-mapping.md)
- [Migration Strategy](./migration-strategy.md)
- [Future Architecture](./future-architecture.md)

## Design principles

- Local-first remains the primary client behavior.
- Backend is additive and versioned.
- Sync is device-aware and conflict-aware.
- User-owned history is soft-deleted, not hard-deleted.
- Zero data loss is the migration target.
