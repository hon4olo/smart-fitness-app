from pathlib import Path

MOBILE_MAIN = "1c49a6f7fd236c30e0539b510d6818470a356273"
BACKEND_MAIN = "2c683c95274409aa5958033e96cb8acf67ca8b56"
PR110_HEAD = "54fe3bcf57745caddb1177ef6c75453befed407f"
PR109_MERGE = "c8d315113881e81f7b6c8522bfb5b439b4b36972"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_section(text: str, start: str, end: str, replacement: str, label: str) -> str:
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
        "- mobile `main`: `f815a38ba92c5432e59adfb52b2b67da4877376f`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile main",
    )
    text = replace_once(
        text,
        f"- backend `main`: `{PR109_MERGE}`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend main",
    )
    marker = f"- backend PR #109 merge: `{PR109_MERGE}`;"
    marker_index = text.find(marker)
    if marker_index < 0:
        raise SystemExit(f"{label} PR110 evidence: marker not found")
    addition = (
        marker
        + f"\n- backend PR #110 exact green head: `{PR110_HEAD}`;"
        + f"\n- backend PR #110 merge: `{BACKEND_MAIN}`;"
    )
    return text[:marker_index] + addition + text[marker_index + len(marker) :]


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text(), "roadmap")
roadmap_p5 = f"""### P5 — password-reset product readiness

Status: active. The provider-neutral backend token/session foundation and localized mobile forgot/reset source flow already exist. Resend `POST /emails` is now the selected concrete delivery API contract, and its trusted reset-link construction, bilingual templates, request builder, strict success parser, idempotency identity, and no-network conformance are merged. Runtime transport, provider failure/retry mapping, backend composition/readiness, release-grade app/universal links, real delivery, and activation remain open.

Existing source foundation:

- backend PR #60, exact head `af192c4fbe48c82f1d8e3ac5c7f020c2949fe72f`, merge `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3`, added generic accepted responses, hashed one-time tokens, cooldown, expiry/replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- mobile PR #200, exact head `5ff6cdb50fe04e35d7294d241e37ea46924c06c2`, merge `1b77802bb765a1a3db6b8dcd1f081c210049a2d0`, added localized capability-gated forgot/reset routes, strict API states, password validation, token hygiene, success handling, and forced return to sign-in;
- the current mobile source supports the private `smartfitnessapp` reset route, but production app/universal-link domain configuration and physical-device validation remain open.

Backend PR #110, exact green head `{PR110_HEAD}`, merge `{BACKEND_MAIN}`:

- selected and documented Resend `POST https://api.resend.com/emails` as the concrete password-reset delivery contract;
- added the fixed HTTPS endpoint, Bearer authorization, required direct-HTTP user agent, JSON content type, and deterministic SHA-256 idempotency key without raw email or token;
- constructs a reset URL only from an exact trusted HTTPS reset-route base with one URL-encoded `token` parameter;
- added bounded bilingual EN/RU subject, plain-text, and HTML templates with exact expiry and unrequested-reset guidance;
- emits only one sender, one recipient, subject, HTML, and plain text;
- added strict bounded exact success parsing for the provider message ID;
- rejects unsafe API keys, email addresses, tokens, expiry values, and link bases with constant non-reflective errors;
- added deterministic no-network tests and did not add an account, credential, sender/domain, DNS, network call, runtime retry, factory, environment selector, readiness, capability, deployment, or activation change.

Remaining P5 boundary:

- add a Resend runtime that performs one bounded shared-transport attempt per adapter attempt and reuses the same idempotency identity;
- define explicit bounded retry ownership and classify only validated provider status/error identifiers while ignoring provider messages;
- map timeout, cancellation, network, rate-limit, idempotency/conflict, server, authentication, sender-verification, validation, security, malformed-success, and contract-drift outcomes into the existing `PasswordResetDelivery` success/final-failure boundary;
- preserve password-reset-service invalidation of the token after final delivery failure and avoid hidden retry multiplication;
- add deterministic timeout, network, cancellation, rate-limit, conflict, terminal/auth/configuration, malformed-response, retry, and secret/email/token/reset-link/provider-payload non-disclosure coverage;
- add strict backend configuration, composition-root support, source-support validation, and readiness only after the runtime adapter is complete and green;
- complete release-grade app/universal-link source configuration, token/navigation/accessibility tests, and later physical-device validation;
- keep sender-domain/DNS setup, provider account and credentials, real email delivery, deployment, OTA/native builds, and production activation external.

"""
roadmap = replace_section(
    roadmap,
    "### P5 — password-reset product readiness\n",
    "### P6 — deployment templates and runbooks\n",
    roadmap_p5,
    "roadmap P5",
)
roadmap_starter = f"""## New-chat starter prompt

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/release-and-account.md`, mobile password-reset routes/tests, backend password-reset service/delivery/configuration contracts, shared provider HTTP transport, and backend `docs/architecture/resend-password-reset-delivery.md`. P0 through P4 autonomous source preparation are complete. The concrete Resend password-reset request/template/parser contract is complete through backend PR #110 exact green head `{PR110_HEAD}`, merge `{BACKEND_MAIN}`. No Resend account, credential, verified sender/domain, DNS, real email, runtime transport, factory/readiness, deployment, or activation was added. Continue with the smallest complete backend runtime slice only: compose exactly one bounded Resend request attempt through the existing shared provider HTTP transport, keep a stable idempotency identity across bounded adapter-owned retries, classify only bounded official status/error identifiers while ignoring messages, map final success/failure into the existing `PasswordResetDelivery` contract, preserve token invalidation after final delivery failure, and add deterministic timeout/network/cancellation/rate-limit/idempotency-conflict/server/authentication/sender-validation/security/malformed-success/redaction/no-network conformance. Do not change environment selectors, composition root, source-support validation, readiness, capabilities, mobile routes, or activation in the same runtime slice. Preserve generic accepted responses, token hashing, cooldown, expiry/replay rejection, all-session revocation, token non-persistence, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, sender domains, DNS, provider accounts, call real providers, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
"""
roadmap = roadmap[: roadmap.index("## New-chat starter prompt\n")] + roadmap_starter
roadmap_path.write_text(roadmap)


plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text(), "implementation plan")
plan_p5 = f"""## P5 active source boundary

The existing backend and mobile foundation remains unchanged:

- generic accepted responses do not disclose account existence;
- hashed one-time tokens retain cooldown, expiry, replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- localized capability-gated forgot/reset routes retain strict API states, password validation, token hygiene, success handling, and forced return to sign-in;
- production app/universal-link configuration, provider operation, and physical-device validation remain open.

Backend PR #110, exact green head `{PR110_HEAD}`, merge `{BACKEND_MAIN}`, completed the selected Resend request/template/parser source contract:

- fixed `POST https://api.resend.com/emails` endpoint and bounded Bearer, JSON, user-agent, and idempotency headers;
- trusted HTTPS reset-route construction with one URL-encoded token query parameter;
- bounded bilingual EN/RU subject, plain-text, and HTML content with exact expiry and security guidance;
- exact request fields limited to sender, one recipient, subject, HTML, and plain text;
- strict bounded success parsing and constant non-reflective request/parser failures;
- deterministic no-network contract, link, template, idempotency, malformed-response, and API-key non-disclosure tests;
- no account, credential, sender/domain, DNS, network call, runtime retry, factory, environment selector, readiness, capability, deployment, or activation change.

Complete the Resend runtime boundary next without changing factory/config/readiness:

- use the existing bounded provider HTTP transport and fixed Resend endpoint;
- perform exactly one transport call per adapter attempt and preserve one stable idempotency key across bounded adapter-owned retries;
- define explicit maximum attempts, timeout bounds, and injected sleep/clock behavior without retry multiplication;
- classify only bounded official status/error identifiers and ignore provider messages and unknown fields;
- map final success/failure into the existing `PasswordResetDelivery.send()` contract so the password-reset service continues consuming undelivered tokens after final failure;
- add deterministic timeout, cancellation, network, rate-limit, idempotency/conflict, server, authentication, sender-validation, security, malformed-success, terminal/retryable, and redaction tests without network access;
- keep email, token, reset URL, API key, sender, provider payload/message/ID, endpoint, body, and full idempotency key out of errors and logs;
- defer environment selector replacement, composition root, source-support validation, readiness, capabilities, mobile app/universal links, credentials, real delivery, deployment, and activation to later bounded slices.

No credential, sender-domain, DNS, provider-account, real delivery, backend deployment, migration execution outside CI, environment activation, OTA, or native build is authorized.

"""
plan = replace_section(
    plan,
    "## P5 active source boundary\n",
    "## Execution rules\n",
    plan_p5,
    "implementation P5",
)
plan_path.write_text(plan)


provider_path = Path("docs/roadmap/provider-readiness.md")
provider = update_baseline(provider_path.read_text(), "provider roadmap")
provider_p5 = f"""## Phase P5 — password-reset product and delivery readiness

Status: active. The provider-neutral token/session backend foundation and localized mobile forgot/reset source flow exist. Resend is the selected delivery API contract, and its request, trusted reset-link, bilingual templates, strict success parser, idempotency identity, and deterministic no-network conformance are merged. Runtime transport, provider failure/retry mapping, composition/readiness, release-grade app/universal links, real delivery, and activation remain open.

Merged evidence:

- backend PR #60 exact head: `af192c4fbe48c82f1d8e3ac5c7f020c2949fe72f`;
- backend PR #60 merge: `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3`;
- mobile PR #200 exact head: `5ff6cdb50fe04e35d7294d241e37ea46924c06c2`;
- mobile PR #200 merge: `1b77802bb765a1a3db6b8dcd1f081c210049a2d0`;
- backend PR #110 exact green head: `{PR110_HEAD}`;
- backend PR #110 merge: `{BACKEND_MAIN}`;
- backend PR #110 passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

Mobile:

- [x] add localized capability-gated `Forgot password` and `Reset password` source routes with strict API states;
- [x] preserve the generic accepted response so account existence is not disclosed;
- [x] retain strict password validation, invalid/expired-token handling, success state, session cleanup, and forced return to sign-in;
- [ ] complete validated production app-link or universal-link configuration for reset tokens;
- [x] keep reset tokens out of ordinary persisted application state, logs, analytics, and post-completion navigation state;
- [x] retain source-level accessibility labels, localized copy, and strict request/response parser coverage;
- [ ] perform authorized native-build and physical-device deep-link validation after source configuration is complete.

Backend delivery:

- [x] preserve hashed one-time tokens, cooldown, expiry, replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- [x] select and document Resend `POST /emails` as the concrete provider API contract;
- [x] add bounded EN/RU plain-text and HTML template source with expiry and security guidance;
- [x] construct links only from an exact trusted HTTPS application reset-route base;
- [x] add fixed bounded request construction, non-token idempotency identity, strict success parsing, and contract-level redaction tests;
- [ ] add the production-shaped Resend runtime through the shared bounded provider HTTP transport;
- [ ] add explicit bounded retry ownership and timeout/network/cancellation/rate-limit/idempotency/server/authentication/sender-validation/security/malformed-response mapping;
- [ ] compose the complete adapter in the backend application root and replace the generic `external_http` selector with the documented Resend selector;
- [ ] update production source-support validation and password-reset readiness only after complete runtime/factory conformance;
- [x] preserve token invalidation when final delivery fails through the existing password-reset service boundary;
- [x] retain password-reset capability gating in the backend contract and pre-auth mobile navigation.

Next bounded slice:

- implement only the Resend runtime transport and failure/retry mapping;
- perform one shared transport call per attempt with a stable idempotency identity;
- parse only bounded provider error identifiers required for classification and ignore provider messages;
- add deterministic no-network conformance for retryable/terminal outcomes and secret/email/token/reset-link/provider-payload non-disclosure;
- do not change environment selectors, composition root, readiness, capabilities, mobile routes, or activation in that runtime PR.

External activation later requires a verified sender domain, DNS records, provider account and credentials, backend deployment, production link-domain association, real non-production delivery evidence, physical-device validation, and explicit capability enablement.

"""
provider = replace_section(
    provider,
    "## Phase P5 — password-reset product and delivery readiness\n",
    "## Phase P6 — deployment configuration, policies, and runbooks\n",
    provider_p5,
    "provider P5",
)
provider = replace_once(
    provider,
    "1. P3 selected OCR adapter and classifier/OCR composition/readiness.\n2. P4 moderation calibration harness.\n3. P5 password-reset mobile, deep-link, template, and delivery readiness.\n4. P6 deployment policies, configuration templates, smoke scripts, and runbooks.\n5. P7 explicit sync conflict-choice contract.\n6. P8 diagnostics, fixed-SHA release gate, and Android source preparation.\n7. P9 technical privacy, legal, and analytics prerequisites.",
    "1. P5 password-reset runtime, composition, deep-link, and delivery readiness.\n2. P6 deployment policies, configuration templates, smoke scripts, and runbooks.\n3. P7 explicit sync conflict-choice contract.\n4. P8 diagnostics, fixed-SHA release gate, and Android source preparation.\n5. P9 technical privacy, legal, and analytics prerequisites.",
    "provider execution order",
)
provider_path.write_text(provider)
