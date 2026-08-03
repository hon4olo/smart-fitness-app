from pathlib import Path

UPDATED_DATE = "2026-08-03"
MOBILE_MAIN = "f815a38ba92c5432e59adfb52b2b67da4877376f"
BACKEND_MAIN = "c8d315113881e81f7b6c8522bfb5b439b4b36972"
PR109_HEAD = "d3b6a1599352a79a4dd2bb8d361148d605de3ec3"


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
        "Updated: 2026-08-02",
        f"Updated: {UPDATED_DATE}",
        f"{label} updated date",
    )
    text = replace_once(
        text,
        "- mobile `main`: `2aaaa59dff69729e0d0f0310b96e92ba6544b2d4`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile baseline",
    )
    text = replace_once(
        text,
        "- backend `main`: `a0f97680189b6daa05a2b5fc22a469d687df23c9`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend baseline",
    )
    marker = "- backend PR #108 merge: `a0f97680189b6daa05a2b5fc22a469d687df23c9`;"
    addition = (
        marker
        + f"\n- backend PR #109 exact green head: `{PR109_HEAD}`;"
        + f"\n- backend PR #109 merge: `{BACKEND_MAIN}`;"
    )
    return replace_once(text, marker, addition, f"{label} PR109 evidence")


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text(), "roadmap")
roadmap_p4 = f"""### P4 — moderation calibration harness

Status: source-complete and merged. The provider-injected calibration core, bounded local CLI/filesystem/reporting boundary, and non-production operator runbook are complete. Representative authorized execution, real provider calls, provider-account/quota/latency evidence, threshold review, product activation, and every calibration claim remain external.

Backend PR #107, exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`:

- added the strict versioned manifest and provider-injected aggregate calibration core;
- reused existing classifier/OCR runners, OCR text moderation, and deterministic media policy;
- added bounded category, decision, mismatch, false-positive/false-negative, undetermined, and failure aggregates;
- added aggregate-only deterministic JSON/CSV rendering and synthetic no-network tests;
- added no corpus, real media, credential, real call, threshold/policy change, deployment, activation, or calibration claim.

Backend PR #108, exact green head `e13d8f53e9eefad9e9f9ea6513b986a40a9e2760`, merge `a0f97680189b6daa05a2b5fc22a469d687df23c9`:

- added strict CLI arguments and deterministic aggregate process states and exit codes;
- added canonical local corpus containment with traversal, symlink, file-type, size, manifest, and JPEG rejection;
- composed configured classifier, OCR, and pure non-persisting OCR text moderation without opening the database;
- added exclusive mode-`0600` no-overwrite JSON/CSV output, deterministic content, synchronization, rollback, and bounded interruption behavior;
- added deterministic filesystem, text-policy, CLI, output, composition, interruption, redaction, and no-network tests;
- kept reports/process output free of case IDs, roots/paths, media bytes/hashes, OCR plaintext, provider details, endpoints, credentials, identity, free text, and exception details.

Backend PR #109, exact green head `{PR109_HEAD}`, merge `{BACKEND_MAIN}`:

- added the operator-facing non-production calibration runbook with exact CLI invocation and fail-closed preflight;
- defined corpus lawful purpose, provenance, minimization, access, bounded retention, secure deletion, and accidental-media incident handling;
- separated corpus ownership, operation, aggregate review, threshold decisions, deletion verification, and incident response;
- defined aggregate-only result review, private report handling, interruption/retry rules, deletion evidence, and privacy-safe operational records;
- explicitly prohibited deriving production quality or thresholds from synthetic tests and kept all real execution/evidence/activation gates external;
- added no corpus, real media, credential, provider account, real call, threshold/policy change, route, database change, deployment, scheduling, activation, public upload, or calibration claim.

P4 external evidence boundary:

- source completion does not prove provider-account access, quota behavior, latency, moderation quality, or fitness-specific error rates;
- representative non-production corpus collection and execution require explicit authorization;
- real provider calls, aggregate evidence review, threshold or policy proposals, product flags, workers, public uploads, and production activation remain external;
- no statement that moderation is calibrated or production-ready is supported until those external gates are completed and reviewed.

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
    "1. P4 moderation calibration operator runbook and external evidence preparation.\n2. P5 password-reset mobile, links, templates, and delivery readiness.\n3. P6 deployment policies, smoke scripts, and runbooks.\n4. P7 backend-owned conflict choices and then mobile UI.\n5. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.\n6. P9 technical privacy, legal, and analytics prerequisites.",
    "1. P5 password-reset mobile, links, templates, and delivery readiness.\n2. P6 deployment policies, smoke scripts, and runbooks.\n3. P7 backend-owned conflict choices and then mobile UI.\n4. P8 diagnostics, fixed-SHA release source gate, and Android source preparation.\n5. P9 technical privacy, legal, and analytics prerequisites.",
    "roadmap execution order",
)
roadmap_starter = f"""## New-chat starter prompt

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/social-network.md`, `docs/roadmap/release-and-account.md`, `docs/architecture/app-context-consumer-inventory.md`, and the relevant backend provider/password-reset architecture and operations documents; then inspect only code and tests relevant to the selected bounded slice. Provider and Release Readiness P0 through P4 autonomous source preparation are complete through backend PR #109 exact green head `{PR109_HEAD}`, merge `{BACKEND_MAIN}`. No representative calibration corpus was run, no real provider call was made, and no calibration or activation claim exists. Continue with the smallest complete P5 password-reset readiness slice after auditing the current mobile forgot/reset routes, deep-link handling, backend token/delivery contracts, capability gating, tests, and roadmap. Select and document a concrete mail-provider API contract or an explicitly approved generic transport before adding a provider-specific payload. Keep provider calls and credentials backend-only; add strict bounded request/response parsing, timeout/failure/redaction coverage, trusted application-link construction, EN/RU plain-text and HTML templates, token invalidation on delivery failure, and source-only mobile deep-link/state/accessibility coverage as appropriate. Preserve generic accepted responses, one-time token expiry/replay rejection, all-session revocation, capability gating, and token non-persistence. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, sender domains, DNS, provider accounts, call real providers, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
"""
roadmap = roadmap[: roadmap.index("## New-chat starter prompt\n")] + roadmap_starter
roadmap_path.write_text(roadmap)


plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text(), "implementation plan")
plan_p4_p5 = f"""## P4 calibration source completion

Backend PR #107, exact green head `ce50efbd088200c572116b62bf627dc25e026b11`, merge `db5ee5ab50c760619dfa254618b5f2de64f2e044`, completed the strict provider-injected aggregate calibration core.

Backend PR #108, exact green head `e13d8f53e9eefad9e9f9ea6513b986a40a9e2760`, merge `a0f97680189b6daa05a2b5fc22a469d687df23c9`, completed the bounded CLI, canonical local filesystem, provider composition, private no-overwrite reporting, interruption, redaction, and deterministic no-network boundary.

Backend PR #109, exact green head `{PR109_HEAD}`, merge `{BACKEND_MAIN}`, completed the source-prepared non-production operations boundary:

- exact CLI invocation and fail-closed commit/build/configuration/filesystem/output preflight;
- separate corpus-owner, operator, reviewer, policy-owner, deletion-verifier, and incident-owner responsibilities;
- lawful-purpose, provenance, minimization, access, retention, secure-deletion, and accidental-media requirements;
- aggregate-only review, private report handling, interruption/retry, deletion verification, and privacy-safe evidence;
- explicit prohibition on treating synthetic tests as provider-quality evidence or changing thresholds/product state during calibration operations.

P4 autonomous source preparation is complete. Corpus collection, credentials, provider-account validation, real calls, representative non-production execution, quota/latency evidence, aggregate review, threshold or policy proposals, product enablement, public uploads, production activation, and every calibration claim remain external and require direct authorization.

## P5 active source boundary

Audit the current password-reset mobile and backend boundaries before implementation, then continue with the smallest complete source-only slice:

- preserve the generic accepted response so account existence is never disclosed;
- preserve hashed one-time token expiry, replay rejection, delivery-failure invalidation, and all-session revocation;
- select and document a concrete mail-provider API contract or explicitly approved generic transport before adding provider-specific request/response code;
- keep credentials and provider calls backend-only and add bounded timeout, provider rejection, malformed-response, retry, redaction, and no-network conformance;
- construct reset links only from a configured trusted application-link base URL;
- add EN/RU plain-text and HTML templates with bounded expiry and security guidance;
- complete mobile forgot/reset route, strict API state, app/universal-link source handling, token hygiene, forced return to sign-in, accessibility, and capability-gated behavior where still missing;
- keep sender-domain/DNS setup, credentials, real email delivery, deployment, OTA/native build, physical-device deep-link validation, and production activation external.

No credential, sender-domain, DNS, provider-account, real delivery, backend deployment, migration execution outside CI, environment activation, OTA, or native build is authorized.

"""
plan = replace_section(
    plan,
    "## P4 calibration status and next bounded slice\n",
    "## Execution rules\n",
    plan_p4_p5,
    "implementation P4/P5 section",
)
plan_path.write_text(plan)


provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(provider_path.read_text(), "provider roadmap")
provider_p4 = f"""## Phase P4 — moderation calibration harness

Status: autonomous source preparation is complete and merged. Representative authorized execution and calibration evidence remain external.

Merged evidence:

- backend PR #107 exact green head: `ce50efbd088200c572116b62bf627dc25e026b11`;
- backend PR #107 merge: `db5ee5ab50c760619dfa254618b5f2de64f2e044`;
- backend PR #108 exact green head: `e13d8f53e9eefad9e9f9ea6513b986a40a9e2760`;
- backend PR #108 merge: `a0f97680189b6daa05a2b5fc22a469d687df23c9`;
- backend PR #109 exact green head: `{PR109_HEAD}`;
- backend PR #109 merge: `{BACKEND_MAIN}`;
- all three exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

- [x] add the strict versioned manifest and provider-injected calibration core;
- [x] add an internal CLI with strict bounded arguments and deterministic aggregate process states/exit codes;
- [x] enforce canonical local corpus containment, bounded manifest/JPEG validation, symlink/path-escape rejection, and safe configured-provider composition;
- [x] report only bounded aggregate category, decision, mismatch, false-positive/false-negative, undetermined, and failure counts;
- [x] exclude case IDs, roots/paths, media bytes/hashes, OCR plaintext, signed URLs, credentials, identity, provider payloads/messages/identifiers, endpoints, free text, and exception details from reports, process output, and operator evidence;
- [x] support deterministic aggregate-only JSON/CSV output with explicit paths, exclusive no-overwrite mode `0600`, synchronization, and rollback after partial failure;
- [x] preserve provider-runner attempt/timeout ownership and bounded interruption before the next case;
- [x] add deterministic filesystem, CLI, text-policy, output, composition, interruption, redaction, and no-network coverage;
- [x] add an operator-facing non-production runbook covering exact invocation, fail-closed preflight, corpus authorization/provenance/access/retention/deletion, aggregate review ownership, threshold-decision boundaries, private evidence, cleanup verification, and accidental-media incident response;
- [ ] run the harness against a representative authorized non-production corpus with explicit approval, real provider access, reviewed aggregate evidence, and documented deletion verification;
- [ ] complete provider-account, quota, latency, moderation-quality, threshold/policy, and activation review before any production claim or enablement.

No corpus, real media, credential values, provider account, real provider call, threshold/policy change, route, database schema, deployment, worker scheduling, environment activation, product enablement, public upload, OTA, native build, or calibration claim was added or performed during autonomous source work.

"""
provider = replace_section(
    provider,
    "## Phase P4 — moderation calibration harness\n",
    "## Phase P5 — password-reset product and delivery readiness\n",
    provider_p4,
    "provider P4 section",
)
provider_path.write_text(provider)
