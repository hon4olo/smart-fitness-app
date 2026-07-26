import crypto from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const baseUrl = process.env.API_BASE_URL ?? 'https://api.peptonio.com';
const password = `SyncSmoke!${crypto.randomUUID()}Aa1`;
const email = `sync-smoke-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@example.com`;
const report = { stages: [], cleanup: null };
let accessToken = null;
let deviceId = null;
let userId = null;
let primaryError = null;

const sanitize = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return body;
  const copy = { ...body };
  delete copy.accessToken;
  delete copy.refreshToken;
  return copy;
};

const parseBody = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await parseBody(response);
  return { response, body };
};

const appendStage = (label, result, body = sanitize(result.body)) => {
  report.stages.push({ label, status: result.response.status, ok: result.response.ok, body });
};

const requireOk = (label, result, details) => {
  appendStage(label, result, details ?? sanitize(result.body));
  if (!result.response.ok) throw new Error(`${label} failed with HTTP ${result.response.status}`);
  return result.body;
};

try {
  requireOk('health', await request('/health'));

  const registerResult = await request('/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName: 'Production Sync Smoke',
      deviceName: 'GitHub Actions sync diagnostic',
      platform: 'ios',
      appVersion: '1.0.2',
    }),
  });
  const register = requireOk('register', registerResult, {
    userId: registerResult.body?.user?.id ?? null,
    deviceId: registerResult.body?.device?.id ?? null,
    hasAccessToken: Boolean(registerResult.body?.accessToken),
    hasRefreshToken: Boolean(registerResult.body?.refreshToken),
  });
  accessToken = register?.accessToken;
  deviceId = register?.device?.id;
  userId = register?.user?.id;
  if (!accessToken || !deviceId || !userId) throw new Error('register response omitted auth identity');

  const authHeaders = {
    authorization: `Bearer ${accessToken}`,
    'content-type': 'application/json',
    accept: 'application/json',
  };
  requireOk('sync status', await request('/v1/sync/status', {
    headers: { authorization: authHeaders.authorization, accept: 'application/json' },
  }));

  const entityId = crypto.randomUUID();
  const now = new Date().toISOString();
  const basePayload = {
    schemaVersion: 1,
    id: entityId,
    dateOfBirth: '2008-01-01',
    calculationSex: null,
    heightCm: null,
    goal: 'muscle_gain',
    activityLevel: 'moderate',
    trainingExperience: null,
    trainingDaysPerWeek: 3,
    targetWeightKg: 82.7,
    targetWeeklyWeightChangeKg: 0.25,
    createdAt: now,
    updatedAt: now,
  };
  const pushProfile = (label, payload, suffix) => request('/v1/sync/push', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      deviceId,
      clientRevision: 0,
      operations: [{
        entityType: 'fitnessProfiles',
        entityId,
        operationType: 'upsert',
        baseRevision: 0,
        idempotencyKey: `sync-smoke:fitness-profile:${entityId}:${suffix}`,
        payload,
      }],
    }),
  }).then((result) => ({ label, result }));

  const withDevice = await pushProfile(
    'fitness profile with payload.deviceId',
    { ...basePayload, deviceId },
    'with-device',
  );
  appendStage(withDevice.label, withDevice.result);
  if (withDevice.result.response.ok) {
    throw new Error('fitness profile payload with deviceId unexpectedly succeeded');
  }

  const withoutDevice = await pushProfile(
    'fitness profile without payload.deviceId',
    basePayload,
    'without-device',
  );
  requireOk(withoutDevice.label, withoutDevice.result);

  const pullResult = await request('/v1/sync/pull', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ deviceId, clientRevision: 0 }),
  });
  requireOk('sync pull', pullResult, {
    revision: pullResult.body?.revision ?? pullResult.body?.serverRevision ?? null,
    changedCount: Array.isArray(pullResult.body?.changedEntities) ? pullResult.body.changedEntities.length : null,
    deletedCount: Array.isArray(pullResult.body?.deletedEntities) ? pullResult.body.deletedEntities.length : null,
    conflictCount: Array.isArray(pullResult.body?.conflicts) ? pullResult.body.conflicts.length : null,
  });
} catch (error) {
  primaryError = error;
  report.error = error instanceof Error ? error.message : String(error);
} finally {
  if (accessToken) {
    try {
      const deletion = await request('/v1/auth/account', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      report.cleanup = { status: deletion.response.status, ok: deletion.response.ok, body: sanitize(deletion.body) };
    } catch (error) {
      report.cleanup = { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
  await writeFile('production-sync-diagnostic.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

if (primaryError) process.exitCode = 1;
