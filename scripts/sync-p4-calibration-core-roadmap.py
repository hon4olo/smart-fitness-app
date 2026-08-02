from pathlib import Path

MOBILE_MAIN = "4e7149c6f36787580a4f21161c7c4dd4f434f5b4"
BACKEND_MAIN = "db5ee5ab50c760619dfa254618b5f2de64f2e044"
PR107_HEAD = "ce50efbd088200c572116b62bf627dc25e026b11"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_first(text: str, old: str, new: str, label: str) -> str:
    index = text.find(old)
    if index < 0:
        raise SystemExit(f"{label}: match missing")
    return text[:index] + new + text[index + len(old) :]


def replace_section(text: str, start: str, end: str, replacement: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise SystemExit(f"{label}: start missing")
    end_index = text.find(end, start_index + len(start))
    if end_index < 0:
        raise SystemExit(f"{label}: end missing")
    return text[:start_index] + replacement + text[end_index:]


def update_baseline(text: str, label: str) -> str:
    text = replace_first(
        text,
        "- mobile `main`: `22f8a8b0b9c888ae38d612d19bc9735d01003f28`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile baseline",
    )
    text = replace_first(
        text,
        "- backend `main`: `95c923c146b0abcad7f97ed7073616cf30ad8bab`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend baseline",
    )
    marker = "- backend PR #106 merge: `95c923c146b0abcad7f97ed7073616cf30ad8bab`;"
    return replace_first(
        text,
        marker,
        marker
        + f"\n- backend PR #107 exact green head: `{PR107_HEAD}`;"
        + f"\n- backend PR #107 merge: `{BACKEND_MAIN}`;",
        f"{label} PR107 evidence",
    )


roadmap_path = Path('ROADMAP_PROGRESS.md')
roadmap = update_baseline(roadmap_path.read_text(), 'roadmap')
roadmap = replace_once(
    roadmap,
    "### P4 — moderation calibration harness### P4 — moderation calibration harness",
    "### P4 — moderation calibration harness",
    'roadmap duplicate P4 heading',
)
roadmap = replace_section(
    roadmap,
    "### P4 — moderation calibration harness\n",
    "### P5 — password-reset product readiness",
    f"""### P4 — moderation calibration harness

Status: active. The strict provider-injected calibration core is merged; safe local corpus I/O, CLI composition, no-overwrite output, and authorized representative execution remain open.

Backend PR #107, exact green head `{PR107_HEAD}`, merge `{BACKEND_MAIN}`:

- added a strict versioned local manifest contract with opaque case IDs, safe relative JPEG paths, existing media asset types, expected policy decisions, and at most 1000 cases;
- added bounded reporting categories for ordinary gym photos, sportswear, bodybuilding stages, progress photos, possible minors, sexual context, violence, text overlays, prohibited content, and ambiguous cases;
- executes injected classifier and OCR providers through the existing provider runners, sends completed OCR text through an injected text-moderation boundary, and applies the existing deterministic media policy;
- added aggregate actual/expected allow-review-reject counts, mismatches, false positives, false negatives, undetermined cases, and bounded input/provider/text failure categories;
- added deterministic aggregate-only JSON and CSV renderers that exclude case IDs, file paths, image bytes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, and exception details;
- added synthetic no-network tests and documented metric, retry, corpus, and privacy boundaries;
- did not add a corpus, real images, credentials, real calls, thresholds, policy changes, routes, database changes, deployment, activation, or calibration claim.

Remaining P4 source boundary:

- add an internal CLI with strict arguments and deterministic exit codes;
- read manifest and JPEG files only from an explicitly selected canonical local corpus root with symlink/path-escape rejection and bounded file sizes;
- compose the already selected classifier/OCR providers and OCR text moderator without logging secrets or plaintext;
- require explicit JSON/CSV output paths, exclusive no-overwrite writes, private file permissions, and cleanup on partial failure;
- add deterministic filesystem, argument, output, interruption, redaction, and no-network tests;
- add operational corpus authorization, access, retention, deletion, and result-review procedures;
- keep representative authorized corpus execution, threshold review, real calls, and all calibration claims external.

""",
    'roadmap P4 section',
)
starter = "> Continue autonomous work on the Smart Fitness Provider and Release Readiness program."
start_index = roadmap.find(starter)
if start_index < 0:
    raise SystemExit('roadmap starter missing')
roadmap = roadmap[:start_index] + f"""> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, backend `docs/architecture/social-media-worker-runtime.md`, backend `docs/architecture/provider-http-transport.md`, backend `docs/architecture/amazon-rekognition-classifier.md`, backend `docs/architecture/amazon-rekognition-ocr.md`, and backend `docs/architecture/media-moderation-calibration.md`; then inspect only code and tests relevant to the selected bounded slice. P0 through P3 are source-complete. P4 calibration core is complete through backend PR #107 exact green head `{PR107_HEAD}`, merge `{BACKEND_MAIN}`. No corpus, real images, credentials, real provider calls, thresholds, deployment, activation, or calibration claim exists. Continue with the smallest complete P4 CLI/filesystem slice: strict CLI arguments and exit codes, canonical local corpus-root containment with symlink/path-escape rejection, bounded manifest/JPEG reads, selected-provider and OCR-text-moderator composition, exclusive mode-0600 JSON/CSV output, partial-failure cleanup, deterministic no-network filesystem tests, and operational corpus handling documentation. Preserve aggregate-only reports and keep case IDs, paths, image bytes, OCR plaintext, provider payloads/messages/identifiers, endpoints, credentials, identity, free text, and exception details out of process output and report files. Representative authorized corpus execution, real calls, threshold review, and calibration claims remain external. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
"""
roadmap_path.write_text(roadmap)


plan_path = Path('docs/implementation-plan.md')
plan = update_baseline(plan_path.read_text(), 'implementation plan')
plan = replace_section(
    plan,
    "## P3 completion and next bounded slice\n",
    "## Execution rules",
    f"""## P4 calibration status and next bounded slice

Backend PR #107, exact green head `{PR107_HEAD}`, merge `{BACKEND_MAIN}`, completed the provider-injected calibration core:

- strict versioned manifest, opaque IDs, safe relative JPEG paths, expected outcomes, and bounded fitness-specific categories;
- existing classifier/OCR provider runners, injected OCR text moderation, and existing deterministic media policy;
- aggregate actual/expected decisions, mismatches, false-positive/false-negative, undetermined, and bounded failure counts;
- aggregate-only deterministic JSON/CSV output with no case/path/media/OCR/provider/secret/identity/error details;
- synthetic no-network tests and architecture documentation;
- no corpus, real image, credential, real call, threshold/policy change, deployment, activation, or calibration claim.

Complete the source-only CLI/filesystem boundary next:

- add strict bounded CLI parsing for corpus root, manifest, JSON output, and optional CSV output;
- canonicalize the corpus root and reject absolute manifest image paths, traversal, symlink escapes, non-regular files, unsupported MIME/signatures, and over-limit manifest/image bytes;
- compose the selected classifier/OCR providers and OCR text moderator only after configuration validation, without reflecting secrets or OCR text;
- write reports with exclusive creation, mode `0600`, no overwrite, deterministic content, and partial-output cleanup;
- emit only bounded versioned aggregate process status and deterministic exit codes;
- add deterministic filesystem, parser, output, failure, interruption, redaction, and no-network tests;
- add operational corpus authorization, access, retention, deletion, and result-review procedures;
- do not run a representative corpus, make a real provider call, tune thresholds, or claim calibration in autonomous source work.

No credentials, real provider call, deployment, migration execution outside CI, worker scheduling, environment activation, product enablement, public upload activation, OTA, or native build is authorized.

""",
    'implementation P4 status',
)
plan_path.write_text(plan)


provider_path = Path('docs/roadmap/provider-readiness.md')
provider = update_baseline(provider_path.read_text(), 'provider roadmap')
provider = replace_once(
    provider,
    "## Phase P4 — moderation calibration harness\n\nStatus: active for source-only harness implementation; representative corpus execution and calibration claims remain external.\n\n## Phase P4 — moderation calibration harness",
    "## Phase P4 — moderation calibration harness\n\nStatus: active. The provider-injected aggregate calibration core is merged; CLI/filesystem safety, operational corpus procedures, and representative authorized execution remain open.",
    'provider duplicate P4 heading',
)
provider = replace_once(
    provider,
    "- [ ] run selected classifier and OCR adapters through the existing deterministic fitness-aware policy;",
    "- [x] run injected classifier and OCR adapters through the existing provider runners, injected OCR text moderation, and deterministic fitness-aware policy; selected-provider CLI composition remains open;",
    'provider runner checkbox',
)
provider = replace_once(
    provider,
    "- [ ] report aggregate allow, review, reject, false-positive, false-negative, timeout, malformed, and unavailable counts;",
    "- [x] report aggregate allow, review, reject, expected/mismatched, false-positive, false-negative, undetermined, input, timeout, invalid, unavailable, and failed counts;",
    'provider report checkbox',
)
provider = replace_once(
    provider,
    "- [ ] group results by bounded categories such as ordinary gym photos, sportswear, bodybuilding stages, progress photos, possible minors, sexual context, violence, text overlays, prohibited content, and ambiguous cases;",
    "- [x] group results by the bounded ordinary-gym, sportswear, bodybuilding-stage, progress-photo, possible-minor, sexual-context, violence, text-overlay, prohibited-content, and ambiguous-case categories;",
    'provider category checkbox',
)
provider = replace_once(
    provider,
    "- [ ] exclude raw images, OCR plaintext, signed URLs, credentials, owner identity, and provider payloads from reports;",
    "- [x] exclude case IDs, paths, raw images, OCR plaintext, signed URLs, credentials, identity, provider payloads/messages/identifiers, endpoints, free text, and exception details from reports;",
    'provider privacy checkbox',
)
provider = replace_once(
    provider,
    "- [ ] support JSON and CSV aggregate output suitable for threshold review;",
    "- [x] support deterministic aggregate-only JSON and CSV output suitable for later threshold review;",
    'provider output checkbox',
)
provider = replace_once(
    provider,
    "- [ ] add an internal CLI that reads a local manifest of representative test images and expected outcomes;",
    f"""- [ ] add an internal CLI that reads a local manifest of representative test images and expected outcomes;
- [x] add the strict versioned manifest and provider-injected calibration core through backend PR #107 exact green head `{PR107_HEAD}`, merge `{BACKEND_MAIN}`;""",
    'provider core evidence',
)
provider = replace_once(
    provider,
    "- [ ] document corpus handling, access, retention, and deletion requirements;",
    "- [ ] complete operational corpus authorization, canonical-root access, retention, deletion, and result-review procedures; the architecture-level privacy and corpus boundary is documented;",
    'provider corpus docs',
)
provider_path.write_text(provider)
