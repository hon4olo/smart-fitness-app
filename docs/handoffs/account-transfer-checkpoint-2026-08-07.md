# Account transfer checkpoint — 2026-08-07

Purpose: canonical recovery point before transferring repository ownership to a new GitHub account. This file is a checkpoint, not a substitute for re-reading current `main`, `AGENTS.md`, roadmap docs, open PRs, and actual code after transfer.

## Repository baseline

- Repository: `hon4olo/smart-fitness-app`
- Default branch: `main`
- `main` immediately before this checkpoint commit: `e9011a8f703f4f7dcea3d47617088554322c8d34`
- That baseline is mobile PR #455: documentation sync for the Social notification roadmap.

## Cross-repository backend checkpoint

Backend recovery is canonically recorded in:

- `smart-fitness-backend/docs/handoffs/account-transfer-checkpoint-2026-08-07.md`

At checkpoint creation, backend `main` immediately before its checkpoint commit was:

- `e8d43fbbc0761ea452c5b37dd69b6572d8af40b8`

Backend PR #178 was the only open PR and its recorded head was:

- `7ed4a97e1975412f677ac5caa6c9d2b1afa62403`

The backend checkpoint also records all prepared `roadmap/p9d-*` branches and their exact SHAs.

## Mobile state

- No open mobile PR existed at this checkpoint.
- Treat `docs/current-status.md`, `docs/implementation-plan.md`, `docs/handoffs/latest.md`, architecture inventory files, and `AGENTS.md` as authoritative project continuation inputs after verifying them against actual `main`.
- Do not rely on this transfer checkpoint alone for feature status.

## Operational restrictions

Do not perform any of the following without direct user authorization:

- OTA/EAS publish;
- native build/install;
- backend deployment or production activation;
- production migration execution;
- credential/secret rotation or production credential changes.

Ordinary inspect/edit/test/commit/PR/merge work may proceed autonomously when safe and consistent with `AGENTS.md`.

## Transfer recovery procedure

After ownership changes:

1. verify the transferred repository under its new owner, preserving Git history rather than recreating it as a new repository;
2. verify `main`, branches, tags, Actions workflows, environments, secrets/variables, deploy keys, branch protection, and integrations;
3. update Git remotes on Mac and Hermes;
4. reconnect/authorize GitHub integrations for the new owner/repositories;
5. read this file, `AGENTS.md`, `docs/implementation-plan.md`, `docs/current-status.md`, `docs/handoffs/latest.md`, and the backend transfer checkpoint;
6. compare actual `main` with the recorded SHAs before continuing roadmap work.

If repository evidence disagrees with remembered conversation context, repository evidence wins.