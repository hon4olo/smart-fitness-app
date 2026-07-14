// Data Layer 1.0 notes
//
// Repository flow:
// UI -> AppContext -> RepositoryProvider -> AppRepository -> StorageAdapter -> local persisted state
//
// Storage flow:
// AppRepository owns the storage key, serialization, deserialization, and normalization boundary.
// StorageAdapter remains a thin primitive for read/write/remove only.
//
// Future sync integration points:
// - RepositoryProvider can return a SyncRepository instead of a local repository.
// - StorageAdapter can continue backing the local cache while a remote source is layered in.
// - Domain metadata here can be reused by future sync/versioning code.

export * from './metadata';
export * from './models';
