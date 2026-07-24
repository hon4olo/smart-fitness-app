import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const MAX_LINES = 500;
const CHECKED_EXTENSIONS = new Set(['.cjs', '.js', '.jsx', '.md', '.mjs', '.ts', '.tsx']);
const EXCLUDED_FILES = new Set(['package-lock.json', 'repomix-output.xml']);

const extensionOf = (path) => {
  const index = path.lastIndexOf('.');
  return index < 0 ? '' : path.slice(index);
};

const countLines = (path) => {
  const content = readFileSync(path, 'utf8');
  if (!content) return 0;
  return content.endsWith('\n') ? content.split('\n').length - 1 : content.split('\n').length;
};

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
  .filter((path) => existsSync(path))
  .filter((path) => CHECKED_EXTENSIONS.has(extensionOf(path)))
  .filter((path) => !EXCLUDED_FILES.has(path));

const violations = trackedFiles
  .map((path) => ({ path, lines: countLines(path) }))
  .filter(({ lines }) => lines > MAX_LINES)
  .sort((left, right) => right.lines - left.lines || left.path.localeCompare(right.path));

if (violations.length > 0) {
  console.error(`Tracked hand-written files must not exceed ${MAX_LINES} lines:`);
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.lines}`);
  }
  process.exit(1);
}

console.log(`Checked ${trackedFiles.length} tracked hand-written files; all are <= ${MAX_LINES} lines.`);