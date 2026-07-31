import { describe, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const ts = require('typescript') as typeof import('typescript');
const { readFileSync, readdirSync, statSync } = require('fs') as {
  readFileSync: (path: string, encoding: string) => string;
  readdirSync: (path: string) => string[];
  statSync: (path: string) => { isDirectory(): boolean };
};
const { relative, resolve } = require('path') as {
  relative: (from: string, to: string) => string;
  resolve: (...parts: string[]) => string;
};

const projectRoot = resolve(__dirname, '..');
const sourceRoot = resolve(projectRoot, 'src');

const collectFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? collectFiles(path) : [path];
  });

const sourceFiles = collectFiles(sourceRoot).filter((path) => /\.(ts|tsx)$/.test(path));

const getBindingFields = (pattern: import('typescript').ObjectBindingPattern): string[] =>
  pattern.elements.flatMap((element) => {
    if (element.dotDotDotToken) return ['*rest'];
    const property = element.propertyName ?? element.name;
    return ts.isIdentifier(property) || ts.isStringLiteral(property) ? [property.text] : [];
  });

const getNamespaceFields = (
  sourceFile: import('typescript').SourceFile,
  namespaceName: string,
): string[] => {
  const fields = new Set<string>();
  const visit = (node: import('typescript').Node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === namespaceName
    ) {
      fields.add(node.name.text);
    }
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === namespaceName &&
      node.argumentExpression &&
      ts.isStringLiteral(node.argumentExpression)
    ) {
      fields.add(node.argumentExpression.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...fields].sort();
};

type Consumer = {
  path: string;
  binding: 'destructured' | 'namespace' | 'direct';
  fields: string[];
  lineCount: number;
};

const consumers: Consumer[] = [];
for (const path of sourceFiles) {
  const source = readFileSync(path, 'utf8');
  if (!source.includes('useAppContext')) continue;

  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const localHookNames = new Set<string>();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@/context/AppContext'
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      if ((element.propertyName ?? element.name).text === 'useAppContext') {
        localHookNames.add(element.name.text);
      }
    }
  }

  if (localHookNames.size === 0) continue;
  let foundCall = false;
  const visit = (node: import('typescript').Node) => {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      ts.isIdentifier(node.initializer.expression) &&
      localHookNames.has(node.initializer.expression.text)
    ) {
      foundCall = true;
      if (ts.isObjectBindingPattern(node.name)) {
        consumers.push({
          path: relative(projectRoot, path),
          binding: 'destructured',
          fields: getBindingFields(node.name).sort(),
          lineCount: source.split(/\r?\n/).length,
        });
      } else if (ts.isIdentifier(node.name)) {
        consumers.push({
          path: relative(projectRoot, path),
          binding: 'namespace',
          fields: getNamespaceFields(sourceFile, node.name.text),
          lineCount: source.split(/\r?\n/).length,
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  if (!foundCall) {
    consumers.push({
      path: relative(projectRoot, path),
      binding: 'direct',
      fields: [],
      lineCount: source.split(/\r?\n/).length,
    });
  }
}

const fieldFrequency = new Map<string, number>();
for (const consumer of consumers) {
  for (const field of new Set(consumer.fields)) {
    fieldFrequency.set(field, (fieldFrequency.get(field) ?? 0) + 1);
  }
}

const report = {
  consumerCount: consumers.length,
  consumers: consumers.sort((left, right) => left.path.localeCompare(right.path)),
  fieldFrequency: [...fieldFrequency.entries()]
    .map(([field, count]) => ({ field, count }))
    .sort((left, right) => right.count - left.count || left.field.localeCompare(right.field)),
};

describe('temporary AppContext consumer inventory', () => {
  test('prints exact consumer fields before public context decomposition', () => {
    throw new Error(`APP_CONTEXT_CONSUMERS=${JSON.stringify(report)}`);
  });
});
