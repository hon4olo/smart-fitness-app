from pathlib import Path

path = Path("ROADMAP_PROGRESS.md")
source = path.read_text()

replacements = [
    (
        "- mobile `main`: `33764007e9599655eeb13be29a33738e83078626`;\n- backend `main`: `7dea48e9001a218f5b5b51db8907a46d2c7bffb6`;",
        "- mobile `main`: `4b4a8f06daaba7f546067bb5c4403902e24e7c50`;\n- backend `main`: `0a2b9d0a9e7f1d3bd3f5a31cf8ef201abc3bdff1`;",
    ),
    (
        "Status: S7.1-S7.6 and the first two S7.7 operations slices are source-complete and merged. Reviewer evidence export plus broader bounded retention/cleanup operations remain active. Public media upload remains disabled.",
        "Status: S7.1-S7.6 and the first three S7.7 operations slices are source-complete and merged. Broader bounded retention and restart-safe cleanup operations remain active. Public media upload remains disabled.",
    ),
    (
        "### S7.7 Remaining active work\n\nRemaining source work is:\n\n- reviewer byte-view/export provider boundary without exposing private object credentials or adding a public staff API;\n- bounded retention deadlines for quarantine uploads, moderation masters, failed/review evidence, approved originals, derivatives, and deletion tombstones;\n- restart-safe cleanup claims, retries, stale-worker recovery, deletion races, account deletion, legal-hold-safe boundaries, and privacy-safe audit records;\n- exact authorization, stale-state, export eligibility, retention, cleanup, legal-hold, and account-deletion tests.",
        "### S7.7 Review evidence export — third slice complete\n\nMerged backend PR #90:\n\n- exact green head: `6496cb9f73c51f526e18afe0d0e5e402a42d8d8e`;\n- merge SHA: `0a2b9d0a9e7f1d3bd3f5a31cf8ef201abc3bdff1`.\n\nCompleted:\n\n- internal-only export of normalized moderation-master bytes for current `review_required` assets, with no public or staff HTTP API;\n- provider-neutral bounded private-object reads with exact private-key namespace, JPEG media type, byte-length, and SHA-256 integrity verification;\n- state-version and row-lock revalidation make decision, cleanup, deletion, or evidence-replacement races fail closed;\n- exclusive mode-`0600` output creation prevents accidental overwrite;\n- append-only privacy-safe audit excludes owner IDs, object keys, output paths, credentials, raw provider payloads, and OCR plaintext;\n- migration `0032`, CLI parsing and file safety, integrity failures, races, immutability, account cascade, PostgreSQL Social API, full Vitest, production startup, and health are green.\n\n### S7.7 Remaining active work\n\nRemaining source work is:\n\n- bounded retention deadlines for quarantine uploads, moderation masters, failed/review evidence, approved originals, derivatives, and deletion tombstones;\n- restart-safe cleanup claims, retries, stale-worker recovery, deletion races, account deletion, legal-hold-safe boundaries, and privacy-safe audit records;\n- exact authorization, stale-state, retention, cleanup, legal-hold, and account-deletion tests.",
    ),
    (
        "## Next execution order\n\n1. Continue S7.7 with the reviewer byte-view/export provider boundary.\n2. Complete broader lifecycle retention deadlines and restart-safe cleanup claims.\n3. Complete false-positive, stale-worker, deletion, account-cleanup, privacy, legal-hold, and export validation before any public media activation.\n4. Run staging, physical-device, release, and rollback gates only with the required authorization and configuration.",
        "## Next execution order\n\n1. Continue S7.7 with broader lifecycle retention deadlines and restart-safe cleanup claims.\n2. Complete stale-worker, deletion-race, account-cleanup, legal-hold-safe, and privacy-safe audit boundaries.\n3. Complete false-positive, retention, cleanup, deletion, account-cleanup, privacy, and legal-hold validation before any public media activation.\n4. Run staging, physical-device, release, and rollback gates only with the required authorization and configuration.",
    ),
    (
        "> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`. Social S7.1-S7.6 plus the S7.7 internal manual-review and owner-appeal slices are source-complete. The next unstarted slice is the reviewer byte-view/export provider boundary, followed by broader bounded retention and restart-safe cleanup operations. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, this roadmap, `docs/roadmap/social-network.md`, and only the files relevant to the requested slice. Reuse the merged managed-media lifecycle, manual-review CAS/audit, owner appeal, strict owner/public descriptors, private object-storage boundary, moderation, delivery, deletion, cleanup, and one-image workout-post contracts. Keep reviewed, appealed, rejected, failed, pending, and deleted assets non-public unless an explicit valid transition approves them. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations outside CI, activate staging/production, configure credentials, connect real storage/CDN/moderation providers, or enable public image uploads without explicit authorization.",
        "> Continue the Smart Fitness roadmap from `ROADMAP_PROGRESS.md`. Social S7.1-S7.6 plus the S7.7 internal manual-review, owner-appeal, and reviewer-evidence-export slices are source-complete. The next unstarted slice is broader bounded retention and restart-safe cleanup operations. At the start, verify exact `main` and open PRs for `hon4olo/smart-fitness-app` and `hon4olo/smart-fitness-backend`; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, this roadmap, `docs/roadmap/social-network.md`, and only the files relevant to the requested slice. Reuse the merged managed-media lifecycle, manual-review CAS/audit, owner appeal, reviewer evidence export, strict owner/public descriptors, private object-storage boundary, moderation, delivery, deletion, cleanup, and one-image workout-post contracts. Keep reviewed, appealed, rejected, failed, pending, and deleted assets non-public unless an explicit valid transition approves them. Do not publish OTA, create/install native builds, deploy backend changes, execute migrations outside CI, activate staging/production, configure credentials, connect real storage/CDN/moderation providers, or enable public image uploads without explicit authorization.",
    ),
]

for old, new in replacements:
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"roadmap replacement mismatch: expected 1, got {count}: {old[:100]!r}")
    source = source.replace(old, new)

path.write_text(source)
Path("scripts/patch-social-s7-7-review-evidence.py").unlink()
Path(".github/workflows/patch-social-s7-7-review-evidence.yml").unlink()
