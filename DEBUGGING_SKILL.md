# Debugging Skill

Use this file for bugfixes, failed validation, broken navigation, broken persistence, TypeScript errors, or regressions.

## Debug Loop

1. Define the exact symptom.
2. Identify the smallest likely file set.
3. Read only the relevant files.
4. Form one concrete hypothesis.
5. Make the smallest possible patch.
6. Run the relevant verification.

For TypeScript / TSX changes, run:
npx tsc --noEmit

7. If verification fails:
   - quote the important error;
   - explain the likely cause;
   - make another minimal patch;
   - verify again.

8. Stop only when:
   - validation passes; or
   - the blocker is explicit and reported.

## Rules

Do not:
- change unrelated files;
- refactor broadly during a bugfix;
- hide failed validation;
- claim completion without checks;
- install dependencies as a debugging shortcut;
- rewrite architecture to fix a local bug.

Do:
- prefer root-cause fixes over cosmetic fixes;
- preserve existing working behavior;
- update PROJECT_LEARNINGS.md when the bug reveals a reusable project-specific lesson.

## Final Debug Report

After a debugging task, report:
- symptom;
- root cause;
- files changed;
- validation command and result;
- any remaining risk;
- whether PROJECT_LEARNINGS.md was updated.
