from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


replace_once(
    'src/context/syncContextModel.ts',
    "  conflictCount: number;\n  error: string | null;\n  syncNow(): Promise<void>;\n",
    "  conflictCount: number;\n  diagnostic: string | null;\n  error: string | null;\n  syncNow(): Promise<void>;\n",
)

replace_once(
    'src/context/SyncContext.tsx',
    "  const [conflictCount, setConflictCount] = useState(0);\n  const [error, setError] = useState<string | null>(null);\n",
    "  const [conflictCount, setConflictCount] = useState(0);\n  const [diagnostic, setDiagnostic] = useState<string | null>(null);\n  const [error, setError] = useState<string | null>(null);\n",
)
replace_once(
    'src/context/SyncContext.tsx',
    "    setStatus(isAuthenticated ? 'syncing' : 'local-only');\n    setError(null);\n",
    "    setStatus(isAuthenticated ? 'syncing' : 'local-only');\n    setDiagnostic(null);\n    setError(null);\n",
)
replace_once(
    'src/context/SyncContext.tsx',
    "      if (rejectedSyncError) {\n        setError(rejectedSyncError);\n        setStatus('error');\n",
    "      if (rejectedSyncError) {\n        setDiagnostic(rejectedSyncError);\n        setError('One or more sync operations were rejected');\n        setStatus('error');\n",
)
replace_once(
    'src/context/SyncContext.tsx',
    "  const value = useMemo<WeightSyncContextValue>(\n    () => ({ conflictCount, error, lastSyncAt, pendingOperations, status, syncNow }),\n    [conflictCount, error, lastSyncAt, pendingOperations, status, syncNow],\n  );\n",
    "  const value = useMemo<WeightSyncContextValue>(\n    () => ({\n      conflictCount,\n      diagnostic,\n      error,\n      lastSyncAt,\n      pendingOperations,\n      status,\n      syncNow,\n    }),\n    [conflictCount, diagnostic, error, lastSyncAt, pendingOperations, status, syncNow],\n  );\n",
)

replace_once(
    'src/app/sync-backup.tsx',
    "  const { conflictCount, error, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();\n",
    "  const { conflictCount, diagnostic, lastSyncAt, pendingOperations, status, syncNow } = useWeightSync();\n",
)
replace_once(
    'src/app/sync-backup.tsx',
    "          {error ? <Text selectable style={styles.errorDetail}>{error}</Text> : null}\n",
    "          {diagnostic ? (\n            <Text selectable style={styles.errorDetail}>{diagnostic}</Text>\n          ) : null}\n",
)

path = Path('tests/settings-data-sync-status.test.ts')
text = path.read_text()
text = text.replace(
    "  it('surfaces the existing sync contract without exposing raw errors', () => {",
    "  it('surfaces sanitized sync diagnostics without exposing the raw error field', () => {",
)
text = text.replace(
    "    expect(details).not.toContain('{error ?');\n",
    "    expect(details).not.toContain('{error ?');\n    expect(details).toContain('{diagnostic ?');\n    expect(details).toContain('selectable');\n",
)
path.write_text(text)

print('Refined sync diagnostics to expose only the sanitized rejection report')
