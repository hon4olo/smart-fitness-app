from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- old ---\n{old}")
    target.write_text(text.replace(old, new, 1))


Path('src/features/settings/syncConflictDiagnostic.ts').write_text("""import type { SyncConflictSnapshot } from '@/storage';

export type SyncConflictDiagnosticKey =
  | 'status'
  | 'reason'
  | 'strategy'
  | 'entityId'
  | 'localRevision'
  | 'remoteRevision'
  | 'baseRevision'
  | 'requestId'
  | 'fields'
  | 'fingerprint';

export type SyncConflictDiagnosticItem = {
  key: SyncConflictDiagnosticKey;
  value: string;
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const readFiniteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const formatRevision = (value: unknown): string | null => {
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value).trim();
    return text || null;
  }
  if (!isRecord(value)) return null;

  const number = readFiniteNumber(value.number);
  const id = readString(value.id);
  const createdAt = readString(value.createdAt);
  const parts = [number === null ? null : `#${Math.floor(number)}`, id, createdAt].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length ? parts.join(' • ') : null;
};

const readStringList = (value: unknown): string | null => {
  if (!Array.isArray(value)) return null;
  const values = value
    .map(readString)
    .filter((item): item is string => Boolean(item))
    .slice(0, 12);
  return values.length ? values.join(', ') : null;
};

const makeFingerprint = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `conflict-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const addItem = (
  items: SyncConflictDiagnosticItem[],
  key: SyncConflictDiagnosticKey,
  value: string | null | undefined,
): void => {
  if (value) items.push({ key, value: value.slice(0, 320) });
};

export const getSyncConflictDiagnosticItems = (
  snapshot: SyncConflictSnapshot,
): SyncConflictDiagnosticItem[] => {
  const details = isRecord(snapshot.details) ? snapshot.details : undefined;
  const result = isRecord(details?.result) ? details.result : undefined;
  const metadata = isRecord(details?.metadata) ? details.metadata : undefined;
  const items: SyncConflictDiagnosticItem[] = [];

  addItem(items, 'status', snapshot.status);
  addItem(
    items,
    'reason',
    snapshot.reason ??
      readString(details?.reason) ??
      readString(result?.reason) ??
      readString(details?.explanation),
  );
  addItem(
    items,
    'strategy',
    readString(details?.resolutionStrategy) ??
      readString(result?.chosenStrategy) ??
      readString(result?.resolutionStrategy),
  );
  addItem(items, 'entityId', snapshot.entityId);
  addItem(items, 'localRevision', formatRevision(details?.localRevision));
  addItem(items, 'remoteRevision', formatRevision(details?.remoteRevision));
  addItem(items, 'baseRevision', formatRevision(details?.baseRevision));
  addItem(
    items,
    'requestId',
    readString(details?.requestId) ??
      readString(metadata?.requestId) ??
      readString(result?.requestId),
  );
  addItem(
    items,
    'fields',
    readStringList(details?.conflictingFields) ?? readStringList(result?.conflictingFields),
  );
  addItem(items, 'fingerprint', makeFingerprint(snapshot.conflictId));

  return items;
};
""")

replace_once(
    'src/features/settings/syncConflictCopy.ts',
    "import type { Translate } from '@/localization';\n",
    "import type { Translate } from '@/localization';\n\nimport type { SyncConflictDiagnosticKey } from './syncConflictDiagnostic';\n",
)
replace_once(
    'src/features/settings/syncConflictCopy.ts',
    "  retryExplanation: string;\n  unknownEntity: string;\n",
    "  retryExplanation: string;\n  diagnosticTitle: string;\n  diagnosticLabels: Record<SyncConflictDiagnosticKey, string>;\n  unknownEntity: string;\n",
)
replace_once(
    'src/features/settings/syncConflictCopy.ts',
    "  retryExplanation: t('syncConflict.retryExplanation'),\n  unknownEntity: t('syncConflict.unknownEntity'),\n",
    "  retryExplanation: t('syncConflict.retryExplanation'),\n  diagnosticTitle: t('syncConflict.diagnosticTitle'),\n  diagnosticLabels: {\n    status: t('syncConflict.diagnostic.status'),\n    reason: t('syncConflict.diagnostic.reason'),\n    strategy: t('syncConflict.diagnostic.strategy'),\n    entityId: t('syncConflict.diagnostic.entityId'),\n    localRevision: t('syncConflict.diagnostic.localRevision'),\n    remoteRevision: t('syncConflict.diagnostic.remoteRevision'),\n    baseRevision: t('syncConflict.diagnostic.baseRevision'),\n    requestId: t('syncConflict.diagnostic.requestId'),\n    fields: t('syncConflict.diagnostic.fields'),\n    fingerprint: t('syncConflict.diagnostic.fingerprint'),\n  },\n  unknownEntity: t('syncConflict.unknownEntity'),\n",
)

replace_once(
    'src/features/settings/SyncConflictReviewCard.tsx',
    "import { getSyncConflictCopy, getSyncConflictEntityLabel } from './syncConflictCopy';\n",
    "import { getSyncConflictCopy, getSyncConflictEntityLabel } from './syncConflictCopy';\nimport { getSyncConflictDiagnosticItems } from './syncConflictDiagnostic';\n",
)
replace_once(
    'src/features/settings/SyncConflictReviewCard.tsx',
    "          {conflicts.map((conflict) => (\n            <View\n              key={conflict.conflictId}\n              style={[styles.conflict, { borderColor: colors.borderSubtle }]}>\n              <Text style={[styles.entity, { color: colors.textPrimary }]}>\n                {getSyncConflictEntityLabel(copy, conflict.entityType)}\n              </Text>\n              <Text style={[styles.meta, { color: colors.textSecondary }]}>\n                {copy.detected}: {formatDate(conflict.detectedAt, { dateStyle: 'medium', timeStyle: 'short' })}\n              </Text>\n              <Text style={[styles.meta, { color: colors.textSecondary }]}>\n                {copy.source}: {copy.sourceLabels[conflict.source]}\n              </Text>\n            </View>\n          ))}\n",
    "          {conflicts.map((conflict) => {\n            const diagnostics = getSyncConflictDiagnosticItems(conflict);\n            return (\n              <View\n                key={conflict.conflictId}\n                style={[styles.conflict, { borderColor: colors.borderSubtle }]}>\n                <Text style={[styles.entity, { color: colors.textPrimary }]}>\n                  {getSyncConflictEntityLabel(copy, conflict.entityType)}\n                </Text>\n                <Text style={[styles.meta, { color: colors.textSecondary }]}>\n                  {copy.detected}: {formatDate(conflict.detectedAt, { dateStyle: 'medium', timeStyle: 'short' })}\n                </Text>\n                <Text style={[styles.meta, { color: colors.textSecondary }]}>\n                  {copy.source}: {copy.sourceLabels[conflict.source]}\n                </Text>\n                <View style={[styles.diagnostic, { borderColor: colors.borderSubtle }]}>\n                  <Text style={[styles.diagnosticTitle, { color: colors.textPrimary }]}>\n                    {copy.diagnosticTitle}\n                  </Text>\n                  {diagnostics.map((item) => (\n                    <Text\n                      key={item.key}\n                      selectable\n                      style={[styles.diagnosticLine, { color: colors.textSecondary }]}>\n                      <Text style={{ color: colors.textPrimary }}>\n                        {copy.diagnosticLabels[item.key]}:\\u00a0\n                      </Text>\n                      {item.value}\n                    </Text>\n                  ))}\n                </View>\n              </View>\n            );\n          })}\n",
)
replace_once(
    'src/features/settings/SyncConflictReviewCard.tsx',
    "  description: {\n    fontSize: Typography.body.fontSize,\n    lineHeight: Typography.body.lineHeight,\n    marginTop: Spacing.one,\n  },\n",
    "  description: {\n    fontSize: Typography.body.fontSize,\n    lineHeight: Typography.body.lineHeight,\n    marginTop: Spacing.one,\n  },\n  diagnostic: {\n    borderRadius: 12,\n    borderWidth: StyleSheet.hairlineWidth,\n    gap: 4,\n    marginTop: Spacing.one,\n    padding: Spacing.two,\n  },\n  diagnosticLine: {\n    fontSize: Typography.caption.fontSize,\n    lineHeight: Typography.caption.lineHeight,\n  },\n  diagnosticTitle: {\n    fontSize: Typography.label.fontSize,\n    fontWeight: Typography.label.fontWeight,\n    lineHeight: Typography.label.lineHeight,\n    marginBottom: 2,\n  },\n",
)

replace_once(
    'src/localization/settingsMessages.ts',
    "  'syncConflict.retryExplanation':\n    'Retrying does not delete local data or discard the server version.',\n  'syncConflict.unknownEntity': 'Account data',\n",
    "  'syncConflict.retryExplanation':\n    'Retrying does not delete local data or discard the server version.',\n  'syncConflict.diagnosticTitle': 'Technical conflict details',\n  'syncConflict.diagnostic.status': 'Status',\n  'syncConflict.diagnostic.reason': 'Reason',\n  'syncConflict.diagnostic.strategy': 'Resolution strategy',\n  'syncConflict.diagnostic.entityId': 'Entity ID',\n  'syncConflict.diagnostic.localRevision': 'Local revision',\n  'syncConflict.diagnostic.remoteRevision': 'Server revision',\n  'syncConflict.diagnostic.baseRevision': 'Base revision',\n  'syncConflict.diagnostic.requestId': 'Request ID',\n  'syncConflict.diagnostic.fields': 'Conflicting fields',\n  'syncConflict.diagnostic.fingerprint': 'Conflict fingerprint',\n  'syncConflict.unknownEntity': 'Account data',\n",
)
replace_once(
    'src/localization/settingsMessages.ts',
    "  'syncConflict.retryExplanation':\n    'Повторная попытка не удаляет локальные данные и не отбрасывает серверную версию.',\n  'syncConflict.unknownEntity': 'Данные аккаунта',\n",
    "  'syncConflict.retryExplanation':\n    'Повторная попытка не удаляет локальные данные и не отбрасывает серверную версию.',\n  'syncConflict.diagnosticTitle': 'Техническая причина конфликта',\n  'syncConflict.diagnostic.status': 'Статус',\n  'syncConflict.diagnostic.reason': 'Причина',\n  'syncConflict.diagnostic.strategy': 'Стратегия разрешения',\n  'syncConflict.diagnostic.entityId': 'ID сущности',\n  'syncConflict.diagnostic.localRevision': 'Локальная ревизия',\n  'syncConflict.diagnostic.remoteRevision': 'Серверная ревизия',\n  'syncConflict.diagnostic.baseRevision': 'Базовая ревизия',\n  'syncConflict.diagnostic.requestId': 'Request ID',\n  'syncConflict.diagnostic.fields': 'Конфликтующие поля',\n  'syncConflict.diagnostic.fingerprint': 'Отпечаток конфликта',\n  'syncConflict.unknownEntity': 'Данные аккаунта',\n",
)

Path('test/sync-conflict-diagnostic.test.ts').write_text("""import { describe, expect, it } from 'vitest';

import { getSyncConflictDiagnosticItems } from '@/features/settings/syncConflictDiagnostic';
import type { SyncConflictSnapshot } from '@/storage';

const snapshot = (conflictId = 'conflict:nutritionTargets:user-1:payload'): SyncConflictSnapshot => ({
  conflictId,
  source: 'push',
  status: 'needsReview',
  entityType: 'nutritionTargets',
  entityId: 'target-1',
  detectedAt: '2026-07-27T14:07:00.000Z',
  reason: 'base revision required for structured merge',
  details: {
    resolutionStrategy: 'manualReview',
    localRevision: { id: 'local-rev', number: 2, createdAt: '2026-07-27T14:06:00.000Z' },
    remoteRevision: { id: 'remote-rev', number: 3, createdAt: '2026-07-27T14:06:30.000Z' },
    metadata: { requestId: 'req-safe-123' },
    conflictingFields: ['calorieTarget', 'proteinTarget'],
    localVersion: { email: 'private@example.com', calorieTarget: 2800, token: 'secret-token' },
    remoteVersion: { calorieTarget: 2500 },
  },
});

describe('sync conflict diagnostics', () => {
  it('surfaces exact safe resolution metadata', () => {
    const items = getSyncConflictDiagnosticItems(snapshot());
    const byKey = Object.fromEntries(items.map((item) => [item.key, item.value]));

    expect(byKey.status).toBe('needsReview');
    expect(byKey.reason).toBe('base revision required for structured merge');
    expect(byKey.strategy).toBe('manualReview');
    expect(byKey.localRevision).toContain('#2');
    expect(byKey.remoteRevision).toContain('#3');
    expect(byKey.requestId).toBe('req-safe-123');
    expect(byKey.fields).toBe('calorieTarget, proteinTarget');
    expect(byKey.fingerprint).toMatch(/^conflict-[0-9a-f]{8}$/);
  });

  it('never exposes local or remote payload content or the raw conflict id', () => {
    const raw = snapshot().conflictId;
    const serialized = JSON.stringify(getSyncConflictDiagnosticItems(snapshot()));

    expect(serialized).not.toContain('private@example.com');
    expect(serialized).not.toContain('secret-token');
    expect(serialized).not.toContain('2800');
    expect(serialized).not.toContain(raw);
  });

  it('creates a stable opaque fingerprint for support', () => {
    const first = getSyncConflictDiagnosticItems(snapshot()).find((item) => item.key === 'fingerprint');
    const second = getSyncConflictDiagnosticItems(snapshot()).find((item) => item.key === 'fingerprint');
    const different = getSyncConflictDiagnosticItems(snapshot('different-conflict')).find(
      (item) => item.key === 'fingerprint',
    );

    expect(first?.value).toBe(second?.value);
    expect(first?.value).not.toBe(different?.value);
  });
});
""")

path = Path('PROJECT_LEARNINGS.md')
text = path.read_text()
needle = "- Conflict policy keys must match actual sync entity names and aliases. `fitnessProfiles` / `fitness_profiles` use last-write-wins; after a fully successful cycle with zero active conflicts, clear stale persisted conflict snapshots so resolved items do not remain permanently in Settings.\n"
addition = needle + "- Conflict review UI must expose sanitized status, reason, strategy, revision metadata, request ID, conflicting field names, and an opaque fingerprint. Never render raw local/remote versions or raw conflict IDs because current conflict IDs may embed serialized entity content.\n"
if text.count(needle) != 1:
    raise RuntimeError('PROJECT_LEARNINGS conflict anchor not found exactly once')
path.write_text(text.replace(needle, addition, 1))

print('Applied sanitized sync conflict diagnostics')
