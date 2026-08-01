import { describe, test } from 'vitest';

declare const __dirname: string;
declare const require: any;

const { readdirSync, readFileSync, statSync } = require('fs') as {
  readdirSync: (path: string) => string[];
  readFileSync: (path: string, encoding: string) => string;
  statSync: (path: string) => { isDirectory: () => boolean };
};
const { relative, resolve } = require('path') as {
  relative: (from: string, to: string) => string;
  resolve: (...parts: string[]) => string;
};
const ts = require('typescript') as typeof import('typescript');

const projectRoot = resolve(__dirname, '..');
const sourceRoot = resolve(projectRoot, 'src');
const workoutFields = new Set([
  'workouts',
  'trainingPrograms',
  'exercises',
  'workoutSessions',
]);

const collectSourceFiles = (directory: string): string[] =>
  readdirSync(directory)
    .flatMap((entry) => {
      const path = resolve(directory, entry);
      if (statSync(path).isDirectory()) return collectSourceFiles(path);
      return /\.(ts|tsx)$/.test(entry) ? [path] : [];
    })
    .sort();

const propertyName = (node: import('typescript').Node) => {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text;
  }
  return node.getText().replace(/^['"]|['"]$/g, '');
};

const collectFieldsForCall = (
  sourceFile: import('typescript').SourceFile,
  call: import('typescript').CallExpression,
) => {
  const fields = new Set<string>();
  const parent = call.parent;

  if (ts.isPropertyAccessExpression(parent) && parent.expression === call) {
    fields.add(parent.name.text);
  }
  if (
    ts.isElementAccessExpression(parent) &&
    parent.expression === call &&
    parent.argumentExpression &&
    ts.isStringLiteral(parent.argumentExpression)
  ) {
    fields.add(parent.argumentExpression.text);
  }

  if (!ts.isVariableDeclaration(parent)) return fields;

  if (ts.isObjectBindingPattern(parent.name)) {
    for (const element of parent.name.elements) {
      fields.add(propertyName(element.propertyName ?? element.name));
    }
    return fields;
  }

  if (!ts.isIdentifier(parent.name)) return fields;
  const bindingName = parent.name.text;

  const visit = (node: import('typescript').Node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === bindingName
    ) {
      fields.add(node.name.text);
    }
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === bindingName &&
      node.argumentExpression &&
      ts.isStringLiteral(node.argumentExpression)
    ) {
      fields.add(node.argumentExpression.text);
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return fields;
};

describe('temporary AppContext inventory', () => {
  test('prints every production useAppContext consumer and fails intentionally', () => {
    const inventory = collectSourceFiles(sourceRoot).flatMap((path) => {
      const source = readFileSync(path, 'utf8');
      if (!source.includes('useAppContext')) return [];

      const sourceFile = ts.createSourceFile(
        path,
        source,
        ts.ScriptTarget.Latest,
        true,
        path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
      );
      const fields = new Set<string>();
      let callCount = 0;

      const visit = (node: import('typescript').Node) => {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'useAppContext'
        ) {
          callCount += 1;
          for (const field of collectFieldsForCall(sourceFile, node)) fields.add(field);
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);

      if (callCount === 0) return [];
      const sortedFields = [...fields].sort();
      const workout = sortedFields.filter((field) => workoutFields.has(field));
      const other = sortedFields.filter((field) => !workoutFields.has(field));
      return [
        {
          path: relative(projectRoot, path).replaceAll('\\', '/'),
          callCount,
          fields: sortedFields,
          workoutFields: workout,
          otherFields: other,
        },
      ];
    });

    console.log(`APP_CONTEXT_INVENTORY_COUNT=${inventory.length}`);
    for (const record of inventory) {
      console.log(`APP_CONTEXT_CONSUMER=${JSON.stringify(record)}`);
    }

    throw new Error(`Intentional inventory failure: ${inventory.length} consumers`);
  });
});
