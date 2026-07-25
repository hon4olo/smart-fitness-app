export type OperationalFailureCategory =
  | 'api'
  | 'auth_refresh'
  | 'persistence'
  | 'sync'
  | 'ui_fatal'
  | 'update'
  | 'unknown';

export type TelemetryOnlineState = 'offline' | 'online' | 'unknown';

export type CrashEventLike = {
  [key: string]: unknown;
  breadcrumbs?: unknown;
  contexts?: Record<string, unknown>;
  exception?: {
    values?: Array<Record<string, unknown>>;
  };
  extra?: unknown;
  logentry?: unknown;
  message?: unknown;
  request?: unknown;
  tags?: Record<string, unknown>;
  user?: unknown;
};

const ALLOWED_TAGS = new Set([
  'app-version',
  'build-number',
  'environment',
  'expo-channel',
  'expo-update-id',
  'failure-category',
  'git-commit',
  'is-embedded-update',
  'online-state',
  'route',
  'runtime-version',
  'support-id',
  'sync-status',
]);

const CONTEXT_FIELDS: Record<string, ReadonlySet<string>> = {
  app: new Set(['app_build', 'app_identifier', 'app_name', 'app_start_time', 'app_version', 'in_foreground']),
  device: new Set(['arch', 'battery_level', 'brand', 'charging', 'family', 'free_memory', 'low_memory', 'memory_size', 'model', 'orientation', 'processor_count', 'simulator']),
  os: new Set(['build', 'kernel_version', 'name', 'rooted', 'version']),
  react_native: new Set(['fabric', 'hermes_debug_info', 'js_engine', 'turbo_module']),
  runtime: new Set(['name', 'version']),
};

const copyAllowedRecordFields = (
  value: unknown,
  allowedFields: ReadonlySet<string>,
): Record<string, unknown> | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of allowedFields) {
    const field = source[key];
    if (
      typeof field === 'string' ||
      typeof field === 'number' ||
      typeof field === 'boolean' ||
      field === null
    ) {
      result[key] = field;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

const sanitizeContexts = (contexts: CrashEventLike['contexts']): Record<string, unknown> | undefined => {
  if (!contexts) return undefined;

  const result: Record<string, unknown> = {};
  for (const [contextName, fields] of Object.entries(CONTEXT_FIELDS)) {
    const context = copyAllowedRecordFields(contexts[contextName], fields);
    if (context) result[contextName] = context;
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

const sanitizeTags = (tags: CrashEventLike['tags']): Record<string, string> | undefined => {
  if (!tags) return undefined;

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    if (!ALLOWED_TAGS.has(key)) continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      result[key] = String(value).slice(0, 200);
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
};

const sanitizeStacktrace = (stacktrace: unknown): unknown => {
  if (!stacktrace || typeof stacktrace !== 'object' || Array.isArray(stacktrace)) return stacktrace;

  const source = stacktrace as Record<string, unknown>;
  if (!Array.isArray(source.frames)) return source;

  return {
    ...source,
    frames: source.frames.map((frame) => {
      if (!frame || typeof frame !== 'object' || Array.isArray(frame)) return frame;
      const { abs_path: _absPath, vars: _vars, ...safeFrame } = frame as Record<string, unknown>;
      return safeFrame;
    }),
  };
};

const sanitizeException = (exception: CrashEventLike['exception']): CrashEventLike['exception'] => {
  if (!exception?.values) return exception;

  return {
    ...exception,
    values: exception.values.map((value) => {
      const mechanism = value.mechanism;
      const safeMechanism = mechanism && typeof mechanism === 'object' && !Array.isArray(mechanism)
        ? copyAllowedRecordFields(mechanism, new Set(['handled', 'synthetic', 'type']))
        : undefined;

      return {
        ...value,
        value: 'Application error',
        mechanism: safeMechanism,
        stacktrace: sanitizeStacktrace(value.stacktrace),
      };
    }),
  };
};

export const sanitizeCrashEvent = <T extends CrashEventLike>(event: T): T => {
  const sanitized = { ...event } as CrashEventLike;
  delete sanitized.breadcrumbs;
  delete sanitized.extra;
  delete sanitized.logentry;
  delete sanitized.message;
  delete sanitized.request;
  delete sanitized.user;
  sanitized.contexts = sanitizeContexts(event.contexts);
  sanitized.tags = sanitizeTags(event.tags);
  sanitized.exception = sanitizeException(event.exception);
  return sanitized as T;
};

const hashText = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, '0');
};

const getSafeStackSignature = (error: Error): string => {
  const stackLines = error.stack?.split('\n').slice(1, 7) ?? [];
  return stackLines.join('|');
};

export const createSupportIdentifier = (error: Error, updateId?: string | null): string =>
  `SF-${hashText(`${error.name}|${getSafeStackSignature(error)}|${updateId ?? 'embedded'}`)}`;

const EXACT_SAFE_ROUTES = new Set([
  '/',
  '/auth',
  '/home',
  '/nutrition',
  '/nutrition/add-food',
  '/nutrition/date-picker',
  '/profile',
  '/progress',
  '/workout-session',
  '/workout-session/exercises',
  '/workout-session-finish',
  '/workouts',
  '/workouts/builder',
  '/workouts/routine/new',
]);

export const normalizeRouteForTelemetry = (pathname: string): string => {
  if (EXACT_SAFE_ROUTES.has(pathname)) return pathname;
  if (/^\/exercises\/[^/]+$/.test(pathname)) return '/exercises/:exerciseId';
  if (/^\/workouts\/program\/[^/]+$/.test(pathname)) return '/workouts/program/:programId';
  if (/^\/workouts\/template\/[^/]+$/.test(pathname)) return '/workouts/template/:workoutId';
  return 'unknown';
};
