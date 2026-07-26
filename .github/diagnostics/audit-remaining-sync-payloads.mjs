import crypto from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const baseUrl = process.env.API_BASE_URL ?? 'https://api.peptonio.com';
const password = `SyncAudit!${crypto.randomUUID()}Aa1`;
const email = `sync-audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}@example.com`;
const report = { stages: [], cleanup: null };
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

const record = (label, result, expectedStatus) => {
  const stage = {
    label,
    status: result.response.status,
    ok: result.response.ok,
    expectedStatus,
    body: result.body,
  };
  report.stages.push(stage);
  if (result.response.status !== expectedStatus) {
    throw new Error(`${label}: expected HTTP ${expectedStatus}, got ${result.response.status}`);
  }
  return result.body;
};

const authHeaders = () => ({
  authorization: `Bearer ${accessToken}`,
  'content-type': 'application/json',
  accept: 'application/json',
});

const push = async (operation) => request('/v1/sync/push', {
  method: 'POST',
  headers: authHeaders(),
  body: JSON.stringify({ deviceId, clientRevision, operations: [operation] }),
});

try {
  record('health', await request('/health'), 200);
  const register = record('register', await request('/v1/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName: 'Remaining Sync Payload Audit',
      deviceName: 'GitHub Actions diagnostic',
      platform: 'ios',
      appVersion: '1.0.2',
    }),
  }), 200);
  accessToken = register.accessToken;
  deviceId = register.device.id;

  record('sync status', await request('/v1/sync/status', {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json' },
  }), 200);

  const now = new Date().toISOString();
  const bodyId = crypto.randomUUID();
  const bodyPayload = {
    schemaVersion: 1,
    id: bodyId,
    metric: 'waist',
    label: 'Waist',
    numericValue: 80,
    unit: 'cm',
    measuredAt: now,
    createdAt: now,
    updatedAt: now,
  };
  record('body measurement with deviceId', await push({
    entityType: 'bodyMeasurements',
    entityId: bodyId,
    operationType: 'upsert',
    baseRevision: 0,
    idempotencyKey: `audit:body:legacy:${bodyId}`,
    payload: { ...bodyPayload, deviceId },
  }), 400);
  const bodyClean = record('body measurement without deviceId', await push({
    entityType: 'bodyMeasurements',
    entityId: bodyId,
    operationType: 'upsert',
    baseRevision: 0,
    idempotencyKey: `audit:body:clean:${bodyId}`,
    payload: bodyPayload,
  }), 200);
  clientRevision = bodyClean.revision;

  const programId = crypto.randomUUID();
  const programPayload = {
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
  };
  record('training program with deviceId', await push({
    entityType: 'trainingPrograms',
    entityId: programId,
    operationType: 'upsert',
    baseRevision: 0,
    idempotencyKey: `audit:program:legacy:${programId}`,
    payload: { ...programPayload, deviceId },
  }), 400);
  const programClean = record('training program without deviceId', await push({
    entityType: 'trainingPrograms',
    entityId: programId,
    operationType: 'upsert',
    baseRevision: 0,
    idempotencyKey: `audit:program:clean:${programId}`,
    payload: programPayload,
  }), 200);
  clientRevision = programClean.revision;

  record('pull after clean operations', await request('/v1/sync/pull', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ deviceId, clientRevision: 0 }),
  }), 200);
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
  await writeFile('remaining-sync-payload-audit.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
