// Data Layer 1.0 notes
//
// Intended flow:
// UI -> AppContext -> Repository -> Local Repository -> Future Cloud Provider
//
// Storage flow:
// AppRepository owns the local storage key, serialization, deserialization, and normalization boundary.
// StorageAdapter remains a thin primitive for read/write/remove only.
//
// Cloud preparation:
// - Repository creation can accept a CloudProvider later without changing AppContext behavior.
// - The local repository remains the source of truth until a cloud layer is explicitly wired in.
// - Domain metadata here can be reused by future sync/versioning code.

export * from './metadata';
export * from './models';
