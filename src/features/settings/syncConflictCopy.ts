import type { Translate } from '@/localization';

import type { SyncConflictDiagnosticKey } from './syncConflictDiagnostic';

export type SyncConflictCopy = {
  title: string;
  healthy: string;
  loading: string;
  loadFailed: string;
  explanation: string;
  detected: string;
  source: string;
  retry: string;
  retrying: string;
  retryExplanation: string;
  diagnosticTitle: string;
  diagnosticLabels: Record<SyncConflictDiagnosticKey, string>;
  unknownEntity: string;
  sourceLabels: Record<'client' | 'push' | 'pull', string>;
  entityLabels: Record<string, string>;
};

export const getSyncConflictCopy = (t: Translate): SyncConflictCopy => ({
  title: t('syncConflict.title'),
  healthy: t('syncConflict.healthy'),
  loading: t('syncConflict.loading'),
  loadFailed: t('syncConflict.loadFailed'),
  explanation: t('syncConflict.explanation'),
  detected: t('syncConflict.detected'),
  source: t('syncConflict.source'),
  retry: t('syncConflict.retry'),
  retrying: t('syncConflict.retrying'),
  retryExplanation: t('syncConflict.retryExplanation'),
  diagnosticTitle: t('syncConflict.diagnosticTitle'),
  diagnosticLabels: {
    status: t('syncConflict.diagnostic.status'),
    reason: t('syncConflict.diagnostic.reason'),
    strategy: t('syncConflict.diagnostic.strategy'),
    entityId: t('syncConflict.diagnostic.entityId'),
    localRevision: t('syncConflict.diagnostic.localRevision'),
    remoteRevision: t('syncConflict.diagnostic.remoteRevision'),
    baseRevision: t('syncConflict.diagnostic.baseRevision'),
    requestId: t('syncConflict.diagnostic.requestId'),
    fields: t('syncConflict.diagnostic.fields'),
    fingerprint: t('syncConflict.diagnostic.fingerprint'),
  },
  unknownEntity: t('syncConflict.unknownEntity'),
  sourceLabels: {
    client: t('syncConflict.source.client'),
    push: t('syncConflict.source.push'),
    pull: t('syncConflict.source.pull'),
  },
  entityLabels: {
    weightHistory: t('syncConflict.entity.weightHistory'),
    bodyMeasurements: t('syncConflict.entity.bodyMeasurements'),
    customExercises: t('syncConflict.entity.customExercises'),
    workoutSessions: t('syncConflict.entity.workoutSessions'),
    workouts: t('syncConflict.entity.workouts'),
    trainingPrograms: t('syncConflict.entity.trainingPrograms'),
    foodEntries: t('syncConflict.entity.foodEntries'),
    mealTemplates: t('syncConflict.entity.mealTemplates'),
    nutritionTargets: t('syncConflict.entity.nutritionTargets'),
    fitnessProfiles: t('syncConflict.entity.fitnessProfiles'),
    userLimitations: t('syncConflict.entity.userLimitations'),
    recoveryCheckIns: t('syncConflict.entity.recoveryCheckIns'),
  },
});

export const getSyncConflictEntityLabel = (
  copy: SyncConflictCopy,
  entityType: string,
): string => copy.entityLabels[entityType] ?? copy.unknownEntity;
