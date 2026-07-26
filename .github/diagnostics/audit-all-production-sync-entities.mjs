import crypto from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const baseUrl = process.env.API_BASE_URL ?? 'https://api.peptonio.com';
const password = `FullSyncAudit!${crypto.randomUUID()}Aa1`;
const email = `full-sync-audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@example.com`;
const report = { baseUrl, stages: [], entities: [], cleanup: null };
let accessToken = null;
let deviceId = null;
let clientRevision = 0;

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await parseBody(response) };
};

const authHeaders = () => ({
  authorization: `Bearer ${accessToken}`,
  'content-type': 'application/json',
  accept: 'application/json',
});

const pushOne = async ({ label, entityType, entityId, payload }) => {
  const operation = {
    entityType,
    entityId,
    operationType: 'upsert',
    baseRevision: 0,
    idempotencyKey: `full-audit:${entityType}:${entityId}`,
    payload,
  };
  const result = await request('/v1/sync/push', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ deviceId, clientRevision, operations: [operation] }),
  });
  const entry = {
    label,
    entityType,
    entityId,
    status: result.response.status,
    ok: result.response.ok,
    body: result.body,
  };
  report.entities.push(entry);
  if (result.response.ok) {
    const revision = Number(result.body?.revision);
    if (Number.isFinite(revision)) clientRevision = revision;
  }
  return entry;
};

const uuid = () => crypto.randomUUID();
const now = new Date().toISOString();
const startedAt = new Date(Date.now() - 30 * 60_000).toISOString();
const date = now.slice(0, 10);
const consumedAt = `${date}T12:00:00.000Z`;

try {
  const health = await request('/health');
  report.stages.push({ label: 'health', status: health.response.status, body: health.body });
  if (!health.response.ok) throw new Error(`health failed: HTTP ${health.response.status}`);

  const register = await request('/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName: 'Full production sync audit',
      deviceName: 'GitHub Actions full sync audit',
      platform: 'ios',
      appVersion: '1.0.2',
    }),
  });
  report.stages.push({ label: 'register', status: register.response.status, body: register.body });
  if (!register.response.ok) throw new Error(`register failed: HTTP ${register.response.status}`);
  accessToken = register.body.accessToken;
  deviceId = register.body.device.id;

  const weightId = uuid();
  await pushOne({
    label: 'weight history',
    entityType: 'weightHistory',
    entityId: weightId,
    payload: { id: weightId, weight: 70, recordedAt: now, createdAt: now, updatedAt: now },
  });

  const workoutSessionId = uuid();
  const workoutSetId = uuid();
  await pushOne({
    label: 'workout session',
    entityType: 'workoutSessions',
    entityId: workoutSessionId,
    payload: {
      schemaVersion: 1,
      id: workoutSessionId,
      workoutId: 'audit-workout',
      workoutTitle: 'Audit workout',
      startedAt,
      finishedAt: now,
      sets: [{
        id: workoutSetId,
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        weight: 100,
        reps: 5,
        completed: true,
      }],
      updatedAt: now,
    },
  });

  const foodId = uuid();
  await pushOne({
    label: 'food entry exact mobile payload',
    entityType: 'foodEntries',
    entityId: foodId,
    payload: {
      schemaVersion: 1,
      id: foodId,
      name: 'Audit food',
      date,
      consumedAt,
      mealType: 'breakfast',
      calories: 100,
      protein: 10,
      carbs: 10,
      fats: 2,
      source: 'manual',
      createdAt: now,
      updatedAt: now,
      deviceId,
    },
  });

  const nutritionTargetId = uuid();
  await pushOne({
    label: 'nutrition target exact mobile payload',
    entityType: 'nutritionTargets',
    entityId: nutritionTargetId,
    payload: {
      schemaVersion: 1,
      id: nutritionTargetId,
      calories: 2500,
      protein: 180,
      carbs: 300,
      fats: 70,
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
      deviceId,
    },
  });

  const profileId = uuid();
  await pushOne({
    label: 'fitness profile repaired payload',
    entityType: 'fitnessProfiles',
    entityId: profileId,
    payload: {
      schemaVersion: 1,
      id: profileId,
      dateOfBirth: null,
      calculationSex: 'male',
      heightCm: 175,
      goal: 'maintain',
      activityLevel: 'moderate',
      trainingExperience: 'intermediate',
      trainingDaysPerWeek: 3,
      targetWeightKg: 70,
      targetWeeklyWeightChangeKg: 0,
      createdAt: now,
      updatedAt: now,
    },
  });

  const workoutTemplateId = uuid();
  await pushOne({
    label: 'workout template exact mobile payload',
    entityType: 'workouts',
    entityId: workoutTemplateId,
    payload: {
      schemaVersion: 1,
      id: workoutTemplateId,
      title: 'Audit template',
      duration: '30 min',
      exercises: [{
        id: 'bench-press',
        name: 'Bench Press',
        muscleGroup: 'Chest',
        isCustom: false,
        createdAt: now,
      }],
      isCustom: true,
      createdAt: now,
      updatedAt: now,
      deviceId,
    },
  });

  const bodyId = uuid();
  await pushOne({
    label: 'body measurement repaired payload',
    entityType: 'bodyMeasurements',
    entityId: bodyId,
    payload: {
      schemaVersion: 1,
      id: bodyId,
      metric: 'waist',
      label: 'Waist',
      numericValue: 80,
      unit: 'cm',
      measuredAt: now,
      createdAt: now,
      updatedAt: now,
    },
  });

  const customExerciseId = uuid();
  await pushOne({
    label: 'custom exercise exact mobile payload',
    entityType: 'customExercises',
    entityId: customExerciseId,
    payload: {
      schemaVersion: 1,
      id: customExerciseId,
      name: 'Audit Press',
      aliases: [],
      primaryMuscles: ['chest'],
      secondaryMuscles: [],
      equipment: ['barbell'],
      movementPattern: ['horizontal_push'],
      difficulty: 'beginner',
      exerciseType: 'compound',
      unilateral: false,
      tags: [],
      instructions: [],
      tips: [],
      commonMistakes: [],
      isCustom: true,
      source: 'user',
      favorite: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  const mealTemplateId = uuid();
  const mealItemId = uuid();
  await pushOne({
    label: 'meal template exact mobile payload',
    entityType: 'mealTemplates',
    entityId: mealTemplateId,
    payload: {
      schemaVersion: 1,
      id: mealTemplateId,
      name: 'Audit meal',
      items: [{
        id: mealItemId,
        name: 'Audit food',
        date,
        mealType: 'breakfast',
        calories: 100,
        protein: 10,
        carbs: 10,
        fats: 2,
        source: 'manual',
        createdAt: now,
      }],
      createdAt: now,
      updatedAt: now,
    },
  });

  const programId = uuid();
  await pushOne({
    label: 'training program repaired payload',
    entityType: 'trainingPrograms',
    entityId: programId,
    payload: {
      schemaVersion: 1,
      id: programId,
      name: 'Audit rest program',
      goal: 'maintenance',
      difficulty: 'beginner',
      durationWeeks: 1,
      days: [{ id: 'audit-rest-day', weekday: 'monday', restDay: true }],
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    },
  });

  const limitationId = uuid();
  await pushOne({
    label: 'user limitation exact mobile payload',
    entityType: 'userLimitations',
    entityId: limitationId,
    payload: {
      schemaVersion: 1,
      id: limitationId,
      kind: 'mobility',
      bodyRegion: 'shoulder',
      side: 'left',
      severity: 'mild',
      status: 'active',
      trainingImpact: 'monitor',
      movementPatterns: [],
      onsetDate: null,
      resolvedDate: null,
      createdAt: now,
      updatedAt: now,
    },
  });

  const recoveryId = uuid();
  await pushOne({
    label: 'recovery check-in exact mobile payload',
    entityType: 'recoveryCheckIns',
    entityId: recoveryId,
    payload: {
      schemaVersion: 1,
      id: recoveryId,
      recordedAt: now,
      sleepDurationHours: 8,
      sleepQuality: 4,
      fatigue: 2,
      soreness: 1,
      stress: 2,
      painInterference: 0,
      readiness: 4,
      createdAt: now,
      updatedAt: now,
    },
  });

  const libraryId = `audit:${uuid()}`;
  await pushOne({
    label: 'nutrition library item exact mobile payload',
    entityType: 'nutritionLibraryItems',
    entityId: libraryId,
    payload: {
      schemaVersion: 1,
      libraryId,
      kind: 'custom',
      name: 'Audit saved food',
      calories: 100,
      protein: 10,
      carbs: 10,
      fats: 2,
      servingSize: 100,
      servingUnit: 'g',
      quantity: '100 g',
      source: 'manual',
      savedAt: now,
      updatedAt: now,
      revision: 1,
    },
  });

  const pull = await request('/v1/sync/pull', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ deviceId, clientRevision: 0 }),
  });
  report.stages.push({ label: 'pull', status: pull.response.status, body: pull.body });

  report.summary = {
    total: report.entities.length,
    passed: report.entities.filter((entry) => entry.ok).length,
    failed: report.entities.filter((entry) => !entry.ok).map((entry) => ({
      label: entry.label,
      entityType: entry.entityType,
      status: entry.status,
      body: entry.body,
    })),
  };
} catch (error) {
  report.error = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  if (accessToken) {
    const deletion = await request('/v1/auth/account', {
      method: 'DELETE',
      headers: authHeaders(),
      body: JSON.stringify({ password }),
    });
    report.cleanup = { status: deletion.response.status, ok: deletion.response.ok, body: deletion.body };
  }
  await writeFile('full-production-sync-audit.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (report.summary?.failed?.length) process.exitCode = 2;
}
