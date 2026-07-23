import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import process from 'node:process';

const MAX_LINES = 500;
const CHECKED_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.md', '.mjs', '.ts', '.tsx']);
const EXCLUDED_FILES = new Set(['package-lock.json', 'repomix-output.xml']);
const ZERO_SHA = /^0+$/;

const readEvent = () => {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) return null;
  return JSON.parse(readFileSync(eventPath, 'utf8'));
};

const resolveBaseSha = () => {
  const event = readEvent();
  const candidate = event?.pull_request?.base?.sha ?? event?.before;
  if (typeof candidate === 'string' && candidate && !ZERO_SHA.test(candidate)) {
    return candidate;
  }
  return 'HEAD^';
};

const extensionOf = (path) => {
  const index = path.lastIndexOf('.');
  return index < 0 ? '' : path.slice(index);
};

const countLines = (path) => {
  const content = readFileSync(path, 'utf8');
  if (!content) return 0;
  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
};

const baseSha = process.argv[2] ?? resolveBaseSha();
const changedFiles = execFileSync(
  'git',
  ['diff', '--name-only', '--diff-filter=ACMR', baseSha, 'HEAD'],
  { encoding: 'utf8' },
)
  .split(/\r?\n/)
  .map((path) => path.trim())
  .filter(Boolean)
  .filter((path) => existsSync(path))
  .filter((path) => CHECKED_EXTENSIONS.has(extensionOf(path)))
  .filter((path) => !EXCLUDED_FILES.has(path));

const violations = changedFiles
  .map((path) => ({ path, lines: countLines(path) }))
  .filter(({ lines }) => lines > MAX_LINES)
  .sort((left, right) => right.lines - left.lines);

if (violations.length > 0) {
  console.error(`Changed hand-written files must not exceed ${MAX_LINES} lines:`);
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.lines}`);
  }
  process.exit(1);
}

console.log(`Checked ${changedFiles.length} changed hand-written files; all are <= ${MAX_LINES} lines.`);
