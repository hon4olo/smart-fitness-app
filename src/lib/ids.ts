const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITY_ID_NAMESPACE = 'smart-fitness-entity-id:v1:';

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value.trim());

const formatUuidBytes = (bytes: Uint8Array): string => {
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0'));

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
};

const createRandomBytes = (): Uint8Array => {
  const bytes = new Uint8Array(16);
  const cryptoApi = globalThis.crypto as Crypto | undefined;

  if (cryptoApi?.getRandomValues) {
    return cryptoApi.getRandomValues(bytes);
  }

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Math.floor(Math.random() * 256);
  }

  return bytes;
};

const hash32 = (value: string, seed: number): number => {
  let hash = (seed ^ value.length) >>> 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 0x45d9f3b) >>> 0;
  }
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b) >>> 0;
  return (hash ^ (hash >>> 16)) >>> 0;
};

export const createDeterministicUuid = (source: string): string => {
  const value = `${ENTITY_ID_NAMESPACE}${source}`;
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, hash32(value, 0x9e3779b1));
  view.setUint32(4, hash32(value, 0x85ebca77));
  view.setUint32(8, hash32(value, 0xc2b2ae3d));
  view.setUint32(12, hash32(value, 0x27d4eb2f));
  return formatUuidBytes(bytes);
};

export const createUuid = (): string => {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID();
  }

  const bytes = createRandomBytes();
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  return formatUuidBytes(bytes);
};

export const ensureUuid = (value: unknown): string => {
  if (isUuid(value)) {
    return value.trim().toLowerCase();
  }

  if (typeof value === 'string' && value.trim()) {
    return createDeterministicUuid(value.trim());
  }

  return createUuid();
};
