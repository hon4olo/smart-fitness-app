from pathlib import Path

path = Path('test/sync-coordinator.test.ts')
text = path.read_text()
old = """      pushOperations: vi.fn(async () => ({
        status: 'idle',
        pendingOperations: 0,
        conflictCount: 0,
        serverTimestamp: NOW,
        appliedOperations: [applied],
      })),
"""
new = """      pushOperations: vi.fn(async () => ({
        status: 'idle' as const,
        pendingOperations: 0,
        conflictCount: 0,
        serverTimestamp: NOW,
        appliedOperations: [applied],
      })),
"""
count = text.count(old)
if count != 1:
    raise RuntimeError(f'expected one partial-push test result, found {count}')
path.write_text(text.replace(old, new, 1))
