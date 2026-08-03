from pathlib import Path

MOBILE_MAIN = "2aaaa59dff69729e0d0f0310b96e92ba6544b2d4"
BACKEND_MAIN = "a0f97680189b6daa05a2b5fc22a469d687df23c9"
PR108_HEAD = "e13d8f53e9eefad9e9f9ea6513b986a40a9e2760"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_section(
    text: str,
    start: str,
    end: str,
    replacement: str,
    label: str,
) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start marker not found")
    end_index = text.find(end, start_index + len(start))
    if end_index < 0:
        raise SystemExit(f"{label}: end marker not found")
    return text[:start_index] + replacement + text[end_index:]


def update_baseline(text: str, label: str) -> str:
    text = replace_once(
        text,
        "- mobile `main`: `4e7149c6f36787580a4f21161c7c4dd4f434f5b4`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile baseline",
    )
    text = replace_once(
        text,
        "- backend `main`: `db5ee5ab50c760619dfa254618b5f2de64f2e044`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend baseline",
    )
    marker = "- backend PR #107 merge: `db5ee5ab50c760619dfa254618b5f2de64f2e044`;"
    addition = (
        marker
        + f"\n- backend PR #108 exact green head: `{PR108_HEAD}`;"
        + f"\n- backend PR #108 merge: `{BACKEND_MAIN}`;"
    )
    return replace_once(text, marker, addition, f"{label} PR108 evidence")


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text(), "roadmap")
roadmap_p4 = f"""### P4 — moderation calibration harness

Status: active. The provider-injected calibration core and bounded local CLI/filesystem/reporting source boundary are merged. A source-only operator runbook remains; representative authorized execution, real provider calls, threshold review, and every calibration claim remain external.

Backend PR #107, exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`:

- added a strict versioned local manifest contract with opaque case IDs, safe relative JPEG paths, existing media asset types, expected policy decisions, and at most 1000 cases;
- added bounded reporting categories for ordinary gym photos, sportswear, bodybuilding stages, progress photos, possible minors, sexual context, violence, text overlays, prohibited content, and ambiguous cases;
- executes injected classifier and OCR providers through the existing provider runners, sends completed OCR text through an injected text-moderation boundary, and applies the existing deterministic media policy;
- added aggregate actual/expected allow-review-reject counts, mismatches, false positives, false negatives, undetermined cases, and bounded input/provider/text failure categories;
- added deterministic aggregate-only JSON and CSV renderers that exclude case IDs, file paths, image bytes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, and exception details;
- added synthetic no-network tests and documented metric, retry, corpus, and privacy boundaries;
- did not add a corpus, real images, credentials, real calls, thresholds, policy changes, routes, database changes, deployment, activation, or calibration claim.

Backend PR #108, exact green head `{PR108_HEAD}`, merge `{BACKEND_MAIN}`:

- added strict bounded CLI arguments and deterministic aggregate process states and exit codes;
- canonicalized an explicitly selected local corpus root and rejected absolute paths, traversal, backslashes, symlinks, non-regular files, malformed manifests, invalid JPEGs, and over-limit files;
- reused the existing asset-specific JPEG validator and provider attempt/timeout runners;
- composed configured classifier, OCR, and pure non-persisting OCR text moderation without opening the database;
- added exclusive no-overwrite mode-`0600` JSON/CSV writes with deterministic content and rollback after partial failure;
- observed `SIGINT` and `SIGTERM` before the next case while allowing an in-flight bounded provider operation to settle;
- added deterministic filesystem, text-policy, CLI, output, composition, interruption, redaction, and no-network tests;
- kept reports and process output free of case IDs, roots/paths, media bytes/hashes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, and exception details;
- did not add a corpus, real provider call, threshold or policy change, route, database change, deployment, worker scheduling, product enablement, public upload, or calibration claim.

Remaining P4 source boundary:

- add an operator-facing non-production runbook with exact CLI invocation shape and fail-closed preflight checks;
- define corpus authorization, lawful purpose/provenance, access control, bounded retention, secure deletion, and accidental-inclusion incident handling;
- define aggregate result review ownership, threshold-decision ownership, and explicit prohibition on deriving production thresholds from synthetic tests alone;
- define report/corpus cleanup evidence and privacy-safe operator logging requirements;
- keep representative corpus execution, real calls, provider-account/quota/latency evidence, threshold changes, product activation, and calibration claims external.

"""
roadmap = replace_section(
    roadmap,
    "### P4 — moderation calibration harness\n",
    "### P5 — password-reset product readiness\n",
    roadmap_p4,
    "roadmap P4 section",
)
roadmap = replace_once(
    roadmap,
    "1. P4 moderation calibration harness.",
    "1. P4 moderation calibration operator runbook and external evidence preparation.",
    "roadmap execution order",
)
roadmap_starter = f"""## New-chat starter prompt

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, backend `docs/architecture/social-media-worker-runtime.md`, backend `docs/architecture/provider-http-transport.md`, backend `docs/architecture/amazon-rekognition-classifier.md`, backend `docs/architecture/amazon-rekognition-ocr.md`, and backend `docs/architecture/media-moderation-calibration.md`; then inspect only code and tests relevant to the selected bounded slice. P0 through P3 are source-complete. P4 calibration core and bounded CLI/filesystem/reporting source boundaries are complete through backend PR #108 exact green head `{PR108_HEAD}`, merge `{BACKEND_MAIN}`. No representative corpus has been run and no calibration claim exists. Continue with the smallest complete source-only P4 operator-runbook slice: document exact non-production CLI invocation, fail-closed configuration and filesystem preflight, corpus authorization/provenance/access/retention/deletion requirements, aggregate result-review ownership, threshold-decision boundaries, privacy-safe evidence, cleanup verification, interruption/retry handling, and incident response for accidental unauthorized media. Do not add or run a corpus, make real provider calls, configure credentials, recommend thresholds from synthetic evidence, or claim calibration. Preserve aggregate-only reports and keep case IDs, paths, image bytes/hashes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, and exception details out of process output, reports, and operator logs. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
"""
roadmap = replace_section(
    roadmap,
    "## New-chat starter prompt\n",
    "",
    roadmap_starter,
    "roadmap starter prompt",
) if False else roadmap[: roadmap.index("## New-chat starter prompt\n")] + roadmap_starter
roadmap_path.write_text(roadmap)


plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text(), "implementation plan")
plan_p4 = f"""## P4 calibration status and next bounded slice

Backend PR #107, exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`, completed the provider-injected calibration core:

- strict versioned manifest, opaque IDs, safe relative JPEG paths, expected outcomes, and bounded fitness-specific categories;
- existing classifier/OCR provider runners, injected OCR text moderation, and existing deterministic media policy;
- aggregate actual/expected decisions, mismatches, false-positive/false-negative, undetermined, and bounded failure counts;
- aggregate-only deterministic JSON/CSV rendering with no case/path/media/OCR/provider/secret/identity/error details;
- synthetic no-network tests and architecture documentation;
- no corpus, real image, credential, real call, threshold/policy change, deployment, activation, or calibration claim.

Backend PR #108, exact green head `{PR108_HEAD}`, merge `{BACKEND_MAIN}`, completed the bounded CLI/filesystem/reporting source boundary:

- strict CLI arguments for corpus root, manifest, JSON output, and optional CSV output with deterministic aggregate exit states;
- canonical-root containment with traversal, absolute-path, backslash, symlink, non-regular-file, size, malformed-manifest, and invalid-JPEG rejection;
- existing JPEG validation, classifier/OCR runners, configured provider composition, and pure non-persisting OCR text moderation;
- exclusive mode-`0600` no-overwrite JSON/CSV output, deterministic content, synchronization, and partial-output rollback;
- interruption observation before the next sequential case without inventing provider cancellation;
- deterministic filesystem, parser, text-policy, output, composition, interruption, redaction, and no-network tests;
- aggregate-only reports/process output with no case IDs, roots/paths, media bytes/hashes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, or exception details;
- no corpus, real call, threshold/policy change, route, database change, deployment, scheduling, activation, public upload, or calibration claim.

Complete the remaining source-only operator-runbook boundary next:

- document the exact non-production CLI invocation shape without credential values or destructive defaults;
- require fail-closed configuration, provider readiness, canonical-root, manifest, output-parent, disk-space, and no-existing-output preflight;
- define authorized corpus purpose/provenance, minimum access, bounded retention, secure deletion, and accidental-inclusion incident handling;
- define aggregate result review ownership, threshold-decision ownership, and the prohibition on treating synthetic tests as quality evidence;
- define interruption/retry rules, private output handling, report/corpus deletion verification, and privacy-safe operator evidence;
- keep representative corpus execution, real provider calls, provider-account/quota/latency evidence, threshold changes, product enablement, public uploads, and every calibration claim external.

No credentials, real provider call, corpus execution, deployment, migration execution outside CI, worker scheduling, environment activation, product enablement, public upload activation, OTA, or native build is authorized.

"""
plan = replace_section(
    plan,
    "## P4 calibration status and next bounded slice\n",
    "## Execution rules\n",
    plan_p4,
    "implementation P4 section",
)
plan_path.write_text(plan)


provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(provider_path.read_text(), "provider roadmap")
provider_p4 = f"""## Phase P4 — moderation calibration harness

Status: active. The strict provider-injected calibration core and bounded local CLI/filesystem/reporting source boundary are merged. A source-only operator runbook remains; representative authorized execution and every calibration claim remain external.

Merged evidence:

- backend PR #107 exact green head: `ce50efbd088200c572116b62bf627dc25e026b11`;
- backend PR #107 merge: `db5ee5ab50c760619dfa254618b5f2de64f2e044`;
- backend PR #108 exact green head: `{PR108_HEAD}`;
- backend PR #108 merge: `{BACKEND_MAIN}`;
- both exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

- [x] add the strict versioned manifest and provider-injected calibration core;
- [x] add an internal CLI with strict bounded arguments and deterministic aggregate process states/exit codes;
- [x] read manifest and JPEG files only inside an explicitly selected canonical local corpus root with traversal, absolute-path, backslash, symlink, non-regular-file, malformed-manifest, invalid-JPEG, and size rejection;
- [x] run configured classifier and OCR adapters through the existing provider runners, pure OCR text moderation, and deterministic fitness-aware policy without opening the database;
- [x] report aggregate allow, review, reject, expected/mismatched, false-positive, false-negative, undetermined, input, timeout, invalid, unavailable, and failed counts;
- [x] group results by bounded ordinary-gym, sportswear, bodybuilding-stage, progress-photo, possible-minor, sexual-context, violence, text-overlay, prohibited-content, and ambiguous-case categories;
- [x] exclude case IDs, roots/paths, raw images/hashes, OCR plaintext, signed URLs, credentials, identity, provider payloads/messages/identifiers, endpoints, free text, and exception details from reports and process output;
- [x] support deterministic aggregate-only JSON and CSV output with explicit paths, exclusive no-overwrite creation, mode `0600`, synchronization, and rollback after partial failure;
- [x] observe interruption before the next case while preserving existing provider-attempt/timeout ownership and avoiding an invented cancellation contract;
- [x] add deterministic filesystem, CLI, text-policy, output, composition, interruption, redaction, and no-network coverage;
- [ ] add an operator-facing non-production runbook covering exact invocation, fail-closed preflight, authorized corpus purpose/provenance/access/retention/deletion, aggregate review ownership, threshold-decision boundaries, private evidence, cleanup verification, and accidental-inclusion incident response;
- [ ] do not claim calibration until the harness is run against a representative authorized non-production corpus with explicit approval and reviewed aggregate evidence.

No corpus, real media, credential values, provider account, real provider call, threshold/policy change, route, database schema, deployment, worker scheduling, environment activation, product enablement, public upload, OTA, native build, or calibration claim was added or performed.

"""
provider = replace_section(
    provider,
    "## Phase P4 — moderation calibration harness\n",
    "## Phase P5 — password-reset product and delivery readiness\n",
    provider_p4,
    "provider P4 section",
)
provider_path.write_text(provider)
