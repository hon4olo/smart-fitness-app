from pathlib import Path

MOBILE_MAIN = "22f8a8b0b9c888ae38d612d19bc9735d01003f28"
BACKEND_MAIN = "95c923c146b0abcad7f97ed7073616cf30ad8bab"
PR106_HEAD = "cecb34a3044110cf252fe845217d199ddad7afd8"


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
        "- mobile `main`: `720273195668d3663ec35ba7baca090127ee1b15`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile baseline",
    )
    text = replace_first(
        text,
        "- backend `main`: `37d4c91cafdeedde122e344fbaca78d00f1c70be`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend baseline",
    )
    marker = "- backend PR #105 merge: `37d4c91cafdeedde122e344fbaca78d00f1c70be`;"
    return replace_first(
        text,
        marker,
        marker
        + f"\n- backend PR #106 exact green head: `{PR106_HEAD}`;"
        + f"\n- backend PR #106 merge: `{BACKEND_MAIN}`;",
        f"{label} PR106 evidence",
    )


roadmap_path = Path('ROADMAP_PROGRESS.md')
roadmap = update_baseline(roadmap_path.read_text(), 'roadmap')
roadmap = replace_once(
    roadmap,
    "Status: active. Provider-neutral transport and the complete Amazon Rekognition classifier and OCR source boundaries are merged; composition-root support, environment schema, production source support, readiness, and activation remain open.",
    "Status: source-complete and merged. Provider-neutral transport, strict Amazon Rekognition classifier/OCR adapters, backend-only configuration, composition-root factories, production source support, privacy-safe readiness, and deterministic conformance are complete. Credentials, real calls, staging calibration, product enablement, deployment, and public uploads remain external activation gates.",
    'roadmap P3 status',
)
pr105_end = "- made no real provider call and did not change factories, environment schema, production source support, readiness, workers, product capabilities, or activation."
roadmap = replace_once(
    roadmap,
    pr105_end,
    f"""{pr105_end}

Backend PR #106, exact green head `{PR106_HEAD}`, merge `{BACKEND_MAIN}`:

- replaced unsupported generic classifier/OCR selectors with explicit `amazon_rekognition` selectors;
- added strict shared Rekognition region, access-key identifier, secret access key, optional session token, and bounded timeout inputs;
- rejected incomplete, unsupported-region, malformed, fallback, and unsafe enabled production configuration;
- composed the classifier and OCR adapters only in the backend application root through one bounded HTTP transport and independent circuit breakers;
- preserved provider-runner retry ownership and kept each adapter timeout aligned with its runner attempt timeout;
- updated source-support and readiness so complete settings are configured/ready while product enablement remains a separate explicit flag;
- added deterministic environment, factory, capability, worker-readiness, redaction, and no-network coverage;
- committed no credential values, made no real provider call, and performed no deployment, scheduling, environment activation, product enablement, or public upload activation.""",
    'roadmap PR106 summary',
)
roadmap = replace_section(
    roadmap,
    "Remaining P3 boundary:\n",
    "### P4 — moderation calibration harness",
    """P3 activation boundary:

- source completion does not prove provider-account access, quotas, latency, model behavior, or fitness-specific moderation quality;
- credentials must be supplied later through the deployment environment or secret store and must not be committed;
- real provider calls, authorized staging corpus work, thresholds, product flags, workers, and public uploads require explicit authorization;
- absent settings preserve unavailable behavior, and credentials alone do not enable managed-media capabilities;
- P4 must produce aggregate calibration evidence before any production enablement decision.

### P4 — moderation calibration harness""",
    'roadmap P3 boundary',
)
roadmap = replace_once(
    roadmap,
    "1. P3 classifier/OCR composition-root configuration, source support, and readiness.\n2. P4 moderation calibration harness.\n3. P5 password-reset mobile, links, templates, and delivery readiness.\n4. P6 deployment policies, smoke scripts, and runbooks.\n5. P7 backend-owned conflict choices and then mobile UI.\n6. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.\n7. P9 technical privacy, legal, and analytics prerequisites.",
    "1. P4 moderation calibration harness.\n2. P5 password-reset mobile, links, templates, and delivery readiness.\n3. P6 deployment policies, smoke scripts, and runbooks.\n4. P7 backend-owned conflict choices and then mobile UI.\n5. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.\n6. P9 technical privacy, legal, and analytics prerequisites.",
    'roadmap execution order',
)
starter = "> Continue autonomous work on the Smart Fitness Provider and Release Readiness program."
start_index = roadmap.find(starter)
if start_index < 0:
    raise SystemExit('roadmap starter missing')
roadmap = roadmap[:start_index] + f"""> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/architecture/app-context-consumer-inventory.md`, backend `docs/architecture/social-media-worker-runtime.md`, backend `docs/architecture/provider-http-transport.md`, backend `docs/architecture/amazon-rekognition-classifier.md`, and backend `docs/architecture/amazon-rekognition-ocr.md`; then inspect only code and tests relevant to the selected bounded slice. P0 through P3 are source-complete. P3 completion evidence: backend PR #106 exact green head `{PR106_HEAD}`, merge `{BACKEND_MAIN}`. The source includes strict Amazon Rekognition classifier/OCR adapters, backend-only configuration, composition-root factories, source support, privacy-safe readiness, and deterministic no-network conformance. No credentials, real provider calls, staging calibration, deployment, worker scheduling, public uploads, or product activation were performed. Continue with the smallest complete P4 calibration-harness slice: define a strict local manifest and bounded fitness-specific expected outcomes, execute injected classifier/OCR providers through the existing deterministic media policy, produce aggregate privacy-safe JSON/CSV reports, and add deterministic fixtures/tests that require no real media or credentials. Do not claim calibration, tune production thresholds, or make real provider calls; representative authorized staging corpus execution remains external. Preserve all lifecycle, ownership, state-version, CAS, lease, moderation, review, appeal, evidence, retention, legal-hold, cleanup, authentication, sync, idempotency, localization, offline, navigation, draft, polling, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, call real providers, create buckets/CDN/DNS, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
"""
roadmap_path.write_text(roadmap)


plan_path = Path('docs/implementation-plan.md')
plan = update_baseline(plan_path.read_text(), 'implementation plan')
plan_marker = "- preserved absent factory support, environment schema, production source readiness, product capability enablement, credentials, real calls, and deployment."
plan = replace_once(
    plan,
    plan_marker,
    f"""{plan_marker}

Backend PR #106, exact green head `{PR106_HEAD}`, merge `{BACKEND_MAIN}`:

- replaced unsupported generic classifier/OCR selectors with explicit `amazon_rekognition` selectors;
- added strict shared backend-only Rekognition environment inputs without committing values;
- rejected incomplete, malformed, unsupported, fallback, and unsafe enabled production configuration;
- composed both selected adapters only in the application root through one bounded transport and independent circuits;
- preserved runner-owned attempts/timeouts and safe unavailable defaults;
- updated source support, configured/ready state, capabilities, and worker readiness while keeping product enablement separate;
- added deterministic configuration, factory, production-validation, capability, readiness, redaction, and no-network tests;
- made no real provider call and performed no deployment, worker scheduling, environment activation, product enablement, or public upload activation.""",
    'implementation PR106 summary',
)
plan = replace_section(
    plan,
    "## Next bounded slice\n",
    "## Execution rules",
    """## P3 completion and next bounded slice

P3 is source-complete. Runtime settings can configure and construct the selected adapters, but no provider account or environment has been activated and no real-call or calibration evidence exists.

Begin P4 with a source-only moderation calibration harness:

- define a strict versioned local manifest with opaque case IDs, bounded fitness-specific categories, expected policy outcomes, and local file references;
- keep image bytes, OCR plaintext, credentials, signed URLs, provider payloads, owner identity, and free-form notes out of reports;
- run injected classifier and OCR providers through the existing provider runners, OCR text moderator, and deterministic fitness-aware media policy;
- produce aggregate allow/review/reject, expected/mismatched, false-positive, false-negative, timeout, malformed, unavailable, and category counts;
- support bounded JSON and CSV aggregate outputs suitable for threshold review without per-case sensitive values;
- add deterministic synthetic/no-network fixtures and tests, plus corpus access, retention, and deletion documentation;
- do not claim calibration or change production thresholds until an authorized representative staging corpus is run externally.

No credentials, real provider call, deployment, migration execution outside CI, worker scheduling, environment activation, product enablement, public upload activation, OTA, or native build is authorized.

""",
    'implementation next slice',
)
plan_path.write_text(plan)


provider_path = Path('docs/roadmap/provider-readiness.md')
provider = update_baseline(provider_path.read_text(), 'provider roadmap')
provider = replace_once(
    provider,
    "Status: active. Provider-neutral transport and the complete Amazon Rekognition classifier and OCR source boundaries are merged; composition-root support, environment schema, production source support, readiness, and activation remain open.",
    "Status: source-complete and merged. Transport, classifier/OCR contracts and runtimes, strict backend-only configuration, composition-root factories, production source support, privacy-safe readiness, and deterministic conformance are complete. External activation and calibration remain open.",
    'provider P3 status',
)
provider = replace_once(
    provider,
    "- backend PR #105 merge: `37d4c91cafdeedde122e344fbaca78d00f1c70be`;\n- all four exact heads passed",
    f"- backend PR #105 merge: `37d4c91cafdeedde122e344fbaca78d00f1c70be`;\n- backend PR #106 exact green head: `{PR106_HEAD}`;\n- backend PR #106 merge: `{BACKEND_MAIN}`;\n- all five exact heads passed",
    'provider PR106 evidence',
)
provider = replace_once(
    provider,
    "- [ ] compose selected adapters only in the backend application root;",
    "- [x] compose selected adapters only in the backend application root through a shared bounded transport and independent circuit instances;",
    'provider composition checkbox',
)
provider = replace_once(
    provider,
    "- [ ] update production source-support validation only after both required adapters are complete;",
    "- [x] update production source-support validation only for the complete selected adapters, with incomplete or unsafe enabled configuration rejected;",
    'provider source support checkbox',
)
provider = replace_once(
    provider,
    "- [ ] keep credentials supplied only by backend environment variables or the deployment secret store;",
    "- [x] define credentials only as backend runtime environment inputs; no credential values are committed or exposed through summaries, capabilities, readiness, or logs;",
    'provider credentials checkbox',
)
provider = replace_once(
    provider,
    "- [ ] keep adapters and managed-media product capabilities disabled until explicit staging configuration and P4 calibration.",
    "- [x] keep safe defaults and product flags disabled; credentials/configuration alone do not enable managed-media capabilities, and staging activation remains external.",
    'provider activation checkbox',
)
provider = replace_once(
    provider,
    "No API key or real provider call was required for the transport, classifier, or OCR slices. Both selected adapter source boundaries are complete; composition-root configuration, source-support validation, operational readiness, and product activation remain separate open gates.",
    "No API key or real provider call was required for P3 source implementation. Both adapters, strict configuration, composition-root factories, production source support, and privacy-safe readiness are complete; provider-account access, real-call evidence, staging calibration, and product activation remain external gates.",
    'provider P3 conclusion',
)
provider = replace_section(
    provider,
    "Next source slice:\n",
    "## Phase P4 — moderation calibration harness",
    """P3 activation boundary:

- no credential values, provider accounts, real calls, deployment, worker activation, public uploads, or production environment changes were performed;
- complete settings may make the source runtime configured and ready, but do not prove account access, quotas, latency, or moderation quality;
- managed-media product flags remain disabled unless explicitly enabled later;
- P4 aggregate calibration evidence and authorized staging validation are required before any production activation decision.

## Phase P4 — moderation calibration harness

Status: active for source-only harness implementation; representative corpus execution and calibration claims remain external.

""",
    'provider P3 boundary',
)
provider_path.write_text(provider)
