from pathlib import Path

path = Path("ROADMAP_PROGRESS.md")
source = path.read_text()

replacements = [
    (
        "- mobile `main`: `846a6c24ea658e3afca4a66506ecd53add69c011`;\n- backend `main`: `ca479965a38ade831dd0fb8993bbd7a4d5d68111`;",
        "- mobile `main`: `33764007e9599655eeb13be29a33738e83078626`;\n- backend `main`: `7dea48e9001a218f5b5b51db8907a46d2c7bffb6`;",
    ),
    (
        "Status: S7.1-S7.6 and the first S7.7 internal-review slice are source-complete and merged. Owner appeal plus bounded retention/cleanup operations remain active. Public media upload remains disabled.",
        "Status: S7.1-S7.6 and the first two S7.7 operations slices are source-complete and merged. Reviewer evidence export plus broader bounded retention/cleanup operations remain active. Public media upload remains disabled.",
    ),
    (
        "### S7.7 Remaining active work\n\nDo not start automatically after this checkpoint. Remaining source work is:\n\n- owner-visible appeal submission for eligible rejected media, with bounded reason codes/text, idempotency, rate limits, and no automatic publication;\n- keep appealed or reopened assets non-public until an explicit operator decision;\n- reviewer byte-view/export provider boundary without exposing private object credentials or adding a public staff API;\n- bounded retention deadlines for quarantine uploads, moderation masters, rejected/failed/review evidence, approved originals, derivatives, and deletion tombstones;\n- restart-safe cleanup claims, retries, stale-worker recovery, deletion races, account deletion, legal-hold-safe boundaries, and privacy-safe audit records;\n- exact authorization, ownership, duplicate, stale-state, appeal eligibility, decision transition, retention, cleanup, and account-deletion tests.",
        "### S7.7 Owner appeals and rejected evidence — second slice complete\n\nMerged backend PR #89:\n\n- exact green head: `d7b1a1e79b515ffa3016869188501a24241e7218`;\n- merge SHA: `7dea48e9001a218f5b5b51db8907a46d2c7bffb6`.\n\nCompleted:\n\n- owner-only appeal submission and status reads for eligible rejected managed-media assets;\n- strict bounded reason/statement contracts, normalized idempotency keys, ownership checks, rate limits, and state-version CAS;\n- appealed assets reopen only to non-public `review_required` and cannot publish without an explicit operator decision;\n- pending appeal context is available only to the internal review queue and resolves atomically with approval or rejection;\n- rejected evidence is retained for fourteen days, closes exactly at expiry, and becomes cleanup-eligible only after the deadline;\n- submission evidence is immutable while account and asset deletion retain cascade-safe behavior;\n- migration `0031`, concurrency, duplicate, stale-state, expiry, cleanup, account-cascade, PostgreSQL Social API, full Vitest, production startup, and health are green.\n\n### S7.7 Remaining active work\n\nRemaining source work is:\n\n- reviewer byte-view/export provider boundary without exposing private object credentials or adding a public staff API;\n- bounded retention deadlines for quarantine uploads, moderation masters, failed/review evidence, approved originals, derivatives, and deletion tombstones;\n- restart-safe cleanup claims, retries, stale-worker recovery, deletion races, account deletion, legal-hold-safe boundaries, and privacy-safe audit records;\n- exact authorization, stale-state, export eligibility, retention, cleanup, legal-hold, and account-deletion tests.",
    ),
    (
        "## Next execution order\n\n1. Resume only when explicitly requested.\n2. Continue S7.7 with owner appeal and bounded retention/cleanup contracts.\n3. Complete false-positive, stale-worker, deletion, account-cleanup, privacy, and legal validation before any public media activation.\n4. Run staging, physical-device, release, and rollback gates only with the required authorization and configuration.",
        "## Next execution order\n\n1. Continue S7.7 with the reviewer byte-view/export provider boundary.\n2. Complete broader lifecycle retention deadlines and restart-safe cleanup claims.\n3. Complete false-positive, stale-worker, deletion, account-cleanup, privacy, legal-hold, and export validation before any public media activation.\n4. Run staging, physical-device, release, and rollback gates only with the required authorization and configuration.",
    ),
    (
        "> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`. Social S7.1-S7.6 and the first S7.7 internal manual-review slice are source-complete. The next unstarted slice is S7.7 owner appeal plus bounded retention/cleanup operations. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, this roadmap, `docs/roadmap/social-network.md`, and only the files relevant to the requested slice. Reuse the merged managed-media lifecycle, manual-review CAS/audit, strict owner/public descriptors, signed private upload, moderation, delivery, deletion, cleanup, and one-image workout-post contracts. Keep reviewed, appealed, rejected, failed, pending, and deleted assets non-public unless an explicit valid transition approves them. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations outside CI, activate staging/production, configure credentials, connect real storage/CDN/moderation providers, or enable public image uploads without explicit authorization.",
        "> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`. Social S7.1-S7.6 plus the S7.7 internal manual-review and owner-appeal slices are source-complete. The next unstarted slice is the reviewer byte-view/export provider boundary, followed by broader bounded retention and restart-safe cleanup operations. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, this roadmap, `docs/roadmap/social-network.md`, and only the files relevant to the requested slice. Reuse the merged managed-media lifecycle, manual-review CAS/audit, owner appeal, strict owner/public descriptors, private object-storage boundary, moderation, delivery, deletion, cleanup, and one-image workout-post contracts. Keep reviewed, appealed, rejected, failed, pending, and deleted assets non-public unless an explicit valid transition approves them. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations outside CI, activate staging/production, configure credentials, connect real storage/CDN/moderation providers, or enable public image uploads without explicit authorization.",
    ),
]

for old, new in replacements:
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"roadmap replacement mismatch: expected 1, got {count}: {old[:80]!r}")
    source = source.replace(old, new)

path.write_text(source)
Path("scripts/patch-social-s7-7-owner-appeals.py").unlink()
Path(".github/workflows/patch-social-s7-7-owner-appeals.yml").unlink()
