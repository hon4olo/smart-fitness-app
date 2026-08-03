from pathlib import Path

MOBILE_MAIN = "1e4bcb4dbd7d7aba8ee16ada91602e21ee401e44"
BACKEND_MAIN = "ecd8a2e425b032be323b9852ba9e60221a1ca968"
PR111_HEAD = "1f0d08ff6eccec676c94bd231e974ad98cdd5176"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_section(
    text: str,
    start_marker: str,
    end_marker: str,
    replacement: str,
    label: str,
) -> str:
    start = text.find(start_marker)
    if start < 0:
        raise SystemExit(f"{label}: start marker missing")
    end = text.find(end_marker, start + len(start_marker))
    if end < 0:
        raise SystemExit(f"{label}: end marker missing")
    return text[:start] + replacement + text[end:]


def update_baseline(text: str, label: str) -> str:
    text = replace_once(
        text,
        "- mobile `main`: `1c49a6f7fd236c30e0539b510d6818470a356273`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile baseline",
    )
    text = replace_once(
        text,
        "- backend `main`: `2c683c95274409aa5958033e96cb8acf67ca8b56`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend baseline",
    )
    marker = "- backend PR #110 merge: `2c683c95274409aa5958033e96cb8acf67ca8b56`;"
    addition = (
        marker
        + f"\n- backend PR #111 exact green head: `{PR111_HEAD}`;"
        + f"\n- backend PR #111 merge: `{BACKEND_MAIN}`;"
    )
    return replace_once(text, marker, addition, f"{label} PR111 evidence")


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text(), "roadmap")
roadmap = replace_once(
    roadmap,
    "Status: active. The provider-neutral backend token/session foundation and localized mobile forgot/reset source flow already exist. Resend `POST /emails` is now the selected concrete delivery API contract, and its trusted reset-link construction, bilingual templates, request builder, strict success parser, idempotency identity, and no-network conformance are merged. Runtime transport, provider failure/retry mapping, backend composition/readiness, release-grade app/universal links, real delivery, and activation remain open.",
    "Status: active. The provider-neutral backend token/session foundation and localized mobile forgot/reset source flow already exist. The selected Resend request/template/parser contract and production-shaped bounded runtime are merged. Backend selector/configuration/composition/source-support/readiness, release-grade app/universal links, real delivery, and activation remain open.",
    "roadmap P5 status",
)
roadmap_pr110_end = "- added deterministic no-network tests and did not add an account, credential, sender/domain, DNS, network call, runtime retry, factory, environment selector, readiness, capability, deployment, or activation change."
roadmap_pr111 = f"""{roadmap_pr110_end}

Backend PR #111, exact green head `{PR111_HEAD}`, merge `{BACKEND_MAIN}`:

- added a production-shaped Resend delivery runtime behind the existing provider-neutral `PasswordResetDelivery` interface;
- performs exactly one shared bounded provider HTTP call per adapter attempt;
- reuses one fixed request body and deterministic idempotency key across at most three attempts;
- accepts only HTTP `200` JSON through the strict existing success parser and discards the validated provider message ID;
- classifies only bounded documented Resend error names while ignoring provider messages and unknown fields;
- retries only timeout/network/open-circuit, standard transient HTTP, `5xx`, `rate_limit_exceeded`, and `concurrent_idempotent_requests` outcomes;
- keeps authentication, validation, sender, quota, invalid-idempotency, security, malformed-success, cancellation, and contract drift terminal;
- caps provider Retry-After at 30 seconds through injected deterministic sleep and returns one constant final delivery error;
- preserves password-reset token invalidation after final delivery failure and excludes email, token, reset URL, API key, sender, provider payload/message/ID, endpoint, body, and full idempotency key from errors and logs;
- added deterministic no-network retry, terminal, malformed-success, optional-transport-field, and redaction coverage without changing selectors, configuration, composition, readiness, capabilities, routes, database, mobile, deployment, or activation."""
roadmap = replace_once(
    roadmap,
    roadmap_pr110_end,
    roadmap_pr111,
    "roadmap PR111 summary",
)
roadmap = replace_section(
    roadmap,
    "Remaining P5 boundary:\n\n",
    "\n\n### P6 — deployment templates and runbooks",
    """Remaining P5 boundary:

- add an explicit `resend` password-reset selector and strict backend-only environment inputs for API key, verified sender identity, trusted reset-route base, bounded timeout, and required user agent without committing values;
- compose the complete Resend adapter only in the backend application root through the existing shared bounded HTTP transport and explicitly scoped circuit containment;
- update production source-support validation, configured/ready state, password-reset capability readiness, and privacy-safe readiness summaries only for complete safe settings;
- keep absent or incomplete settings fail-closed and preserve unavailable delivery as the safe default;
- ensure credentials and readiness remain inert until the explicit password-reset product flag is enabled;
- add deterministic environment, factory, source-support, production-validation, readiness, capability, redaction, and no-network coverage;
- complete release-grade mobile app/universal-link source configuration, strict token/navigation/accessibility coverage, and later authorized native physical-device validation;
- keep sender-domain/DNS setup, provider account and credentials, real email delivery, backend deployment, OTA/native builds, and production activation external.""",
    "roadmap remaining P5",
)
roadmap = replace_once(
    roadmap,
    "1. P5 password-reset mobile, links, templates, and delivery readiness.",
    "1. P5 password-reset backend composition/readiness and mobile production-link source configuration.",
    "roadmap execution order",
)
roadmap = replace_section(
    roadmap,
    "## New-chat starter prompt\n\n",
    "\n",
    f"""## New-chat starter prompt

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/release-and-account.md`, mobile password-reset routes/tests and app-link configuration, backend password-reset service/delivery/configuration/factory contracts, shared provider HTTP transport, and backend `docs/architecture/resend-password-reset-delivery.md`. P0 through P4 autonomous source preparation are complete. The Resend request/template/parser contract is complete through backend PR #110 exact green head `54fe3bcf57745caddb1177ef6c75453befed407f`, merge `2c683c95274409aa5958033e96cb8acf67ca8b56`. The production-shaped Resend runtime is complete through backend PR #111 exact green head `{PR111_HEAD}`, merge `{BACKEND_MAIN}`. No Resend account, credential, verified sender/domain, DNS, real email, environment selector, composition-root support, source readiness, capability enablement, deployment, or activation was added. Continue with the smallest complete backend composition/readiness slice: add an explicit `resend` selector and strict backend-only environment inputs, compose the completed adapter only in the application root through the existing bounded transport and scoped circuit boundary, update source-support validation and privacy-safe configured/ready state only for complete safe settings, preserve unavailable fail-closed defaults, and add deterministic environment/factory/production-validation/readiness/capability/redaction/no-network coverage. Credentials or readiness alone must not enable password reset; retain the explicit product flag and generic accepted response. After the backend slice is merged and the mobile roadmaps are synchronized, continue with release-grade mobile app/universal-link source configuration and strict reset-token navigation/accessibility tests without publishing or building. Preserve token hashing, cooldown, expiry/replay rejection, undelivered-token invalidation, password replacement, all-session revocation, token non-persistence, auth/offline/navigation/localization boundaries, provider-detail non-disclosure, and every existing lifecycle/idempotency/privacy contract. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, sender domains, DNS, provider accounts, call real providers, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
""",
    "roadmap starter prompt",
)
roadmap_path.write_text(roadmap)


plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text(), "implementation plan")
plan_pr110_end = "- no account, credential, sender/domain, DNS, network call, runtime retry, factory, environment selector, readiness, capability, deployment, or activation change."
plan_pr111 = f"""{plan_pr110_end}

Backend PR #111, exact green head `{PR111_HEAD}`, merge `{BACKEND_MAIN}`, completed the production-shaped Resend runtime boundary:

- one bounded shared provider HTTP call per adapter attempt with a fixed request body and stable deterministic idempotency identity;
- at most three adapter-owned attempts with bounded timeout, capped Retry-After, and injected deterministic sleep;
- strict HTTP-200 success parsing with provider message-ID discard;
- bounded documented Resend error-name classification while ignoring messages and unknown fields;
- retry only for timeout/network/open-circuit, transient HTTP, `5xx`, rate-limit, and concurrent-idempotency outcomes;
- terminal authentication, sender, validation, quota, invalid-idempotency, security, cancellation, malformed-success, and contract-drift outcomes;
- one constant final delivery error preserving password-reset token invalidation after final failure;
- deterministic no-network runtime, retry, terminal, malformed-success, optional-transport-field, and redaction coverage;
- no environment selector, composition root, source-support/readiness, capability, route, database, mobile, credential, provider account, real delivery, deployment, or activation change."""
plan = replace_once(plan, plan_pr110_end, plan_pr111, "implementation PR111 summary")
plan = replace_section(
    plan,
    "Complete the Resend runtime boundary next without changing factory/config/readiness:\n\n",
    "\n\nNo credential, sender-domain, DNS, provider-account, real delivery, backend deployment, migration execution outside CI, environment activation, OTA, or native build is authorized.",
    """Complete the Resend backend composition and readiness boundary next without activating delivery:

- add an explicit `resend` selector and strict environment schema for API key, verified sender, trusted reset-route base, bounded transport timeout, and required direct-HTTP user agent;
- keep all values backend-only and redact provider identity, secrets, email, token, reset URL, sender, request body, provider payload/message/ID, endpoint, and full idempotency key from summaries, capabilities, errors, and logs;
- compose the complete Resend adapter only in the application root through the existing shared bounded HTTP transport and explicitly scoped circuit containment;
- update production source-support validation only for the complete selected adapter and reject incomplete, malformed, fallback, unavailable, or unsafe enabled production configuration;
- preserve separate configured, ready, and enabled states, unavailable safe defaults, generic accepted responses, and explicit product-flag ownership;
- add deterministic environment, factory, source-support, production-validation, readiness, capability, redaction, and no-network tests;
- defer release-grade mobile app/universal-link source configuration to the following bounded mobile slice;
- keep sender-domain/DNS setup, provider account/credentials, real delivery, deployment, OTA/native builds, physical-device validation, and production activation external.""",
    "implementation next slice",
)
plan_path.write_text(plan)


provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(provider_path.read_text(), "provider roadmap")
provider = replace_once(
    provider,
    "Status: active. The provider-neutral token/session backend foundation and localized mobile forgot/reset source flow exist. Resend is the selected delivery API contract, and its request, trusted reset-link, bilingual templates, strict success parser, idempotency identity, and deterministic no-network conformance are merged. Runtime transport, provider failure/retry mapping, composition/readiness, release-grade app/universal links, real delivery, and activation remain open.",
    "Status: active. The provider-neutral token/session backend foundation and localized mobile forgot/reset source flow exist. The selected Resend request/template/parser contract and production-shaped bounded runtime are merged. Backend selector/configuration/composition/source-support/readiness, release-grade app/universal links, real delivery, and activation remain open.",
    "provider P5 status",
)
provider = replace_once(
    provider,
    "- backend PR #110 merge: `2c683c95274409aa5958033e96cb8acf67ca8b56`;\n- backend PR #110 passed",
    f"- backend PR #110 merge: `2c683c95274409aa5958033e96cb8acf67ca8b56`;\n- backend PR #111 exact green head: `{PR111_HEAD}`;\n- backend PR #111 merge: `{BACKEND_MAIN}`;\n- backend PR #110 and PR #111 passed",
    "provider PR111 evidence",
)
provider = replace_once(
    provider,
    "- [ ] add the production-shaped Resend runtime through the shared bounded provider HTTP transport;",
    "- [x] add the production-shaped Resend runtime through the shared bounded provider HTTP transport;",
    "provider runtime checkbox",
)
provider = replace_once(
    provider,
    "- [ ] add explicit bounded retry ownership and timeout/network/cancellation/rate-limit/idempotency/server/authentication/sender-validation/security/malformed-response mapping;",
    "- [x] add explicit bounded retry ownership and timeout/network/cancellation/rate-limit/idempotency/server/authentication/sender-validation/security/malformed-response mapping;",
    "provider mapping checkbox",
)
provider = replace_section(
    provider,
    "Next bounded slice:\n\n",
    "\n\nExternal activation later requires",
    """Next bounded slice:

- add the explicit `resend` backend selector and strict runtime environment inputs without committing values;
- compose the complete adapter only in the backend application root through the shared bounded transport and an explicitly scoped circuit instance;
- update production source-support validation and password-reset configured/ready state only for complete safe settings;
- preserve unavailable fail-closed defaults, generic accepted responses, explicit product-flag ownership, and capability disablement when configuration is absent or incomplete;
- add deterministic environment, factory, source-support, production-validation, readiness, capability, redaction, and no-network coverage;
- do not configure credentials, verified sender/domain, DNS, provider account, real delivery, deployment, or activation in that backend PR;
- after backend composition/readiness is merged, complete release-grade mobile app/universal-link source configuration and strict reset-token navigation/accessibility coverage in a separate mobile slice.""",
    "provider next slice",
)
provider_path.write_text(provider)
