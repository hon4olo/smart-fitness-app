from pathlib import Path

MOBILE_MAIN = "1e4bcb4dbd7d7aba8ee16ada91602e21ee401e44"
BACKEND_MAIN = "ecd8a2e425b032be323b9852ba9e60221a1ca968"
PR111_HEAD = "1f0d08ff6eccec676c94bd231e974ad98cdd5176"
PR110_MERGE = "2c683c95274409aa5958033e96cb8acf67ca8b56"


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
        "- mobile `main`: `1c49a6f7fd236c30e0539b510d6818470a356273`;",
        f"- mobile `main`: `{MOBILE_MAIN}`;",
        f"{label} mobile main",
    )
    text = replace_once(
        text,
        f"- backend `main`: `{PR110_MERGE}`;",
        f"- backend `main`: `{BACKEND_MAIN}`;",
        f"{label} backend main",
    )
    marker = f"- backend PR #110 merge: `{PR110_MERGE}`;"
    marker_index = text.find(marker)
    if marker_index < 0:
        raise SystemExit(f"{label} PR111 evidence: marker not found")
    addition = (
        marker
        + f"\n- backend PR #111 exact green head: `{PR111_HEAD}`;"
        + f"\n- backend PR #111 merge: `{BACKEND_MAIN}`;"
    )
    return text[:marker_index] + addition + text[marker_index + len(marker) :]


roadmap_path = Path("ROADMAP_PROGRESS.md")
roadmap = update_baseline(roadmap_path.read_text(), "roadmap")
roadmap_p5 = f"""### P5 — password-reset product readiness

Status: active. The provider-neutral token/session backend foundation and localized mobile forgot/reset source flow exist. The selected Resend request/template/parser contract and production-shaped bounded runtime are merged. Backend environment selector, composition-root support, production source validation/readiness, release-grade app/universal links, real delivery, and activation remain open.

Existing source foundation:

- backend PR #60, exact head `af192c4fbe48c82f1d8e3ac5c7f020c2949fe72f`, merge `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3`, added generic accepted responses, hashed one-time tokens, cooldown, expiry/replay rejection, undelivered-token invalidation, password replacement, and all-session revocation;
- mobile PR #200, exact head `5ff6cdb50fe04e35d7294d241e37ea46924c06c2`, merge `1b77802bb765a1a3db6b8dcd1f081c210049a2d0`, added localized capability-gated forgot/reset routes, strict API states, password validation, token hygiene, success handling, and forced return to sign-in;
- backend PR #110, exact green head `54fe3bcf57745caddb1177ef6c75453befed407f`, merge `{PR110_MERGE}`, selected the Resend API and completed fixed request, trusted link, EN/RU template, idempotency, strict success parser, and no-network contract boundaries.

Backend PR #111, exact green head `{PR111_HEAD}`, merge `{BACKEND_MAIN}`:

- added the Resend adapter behind the existing provider-neutral `PasswordResetDelivery` interface;
- builds one request before the attempt loop and reuses the exact URL, body, and non-token idempotency key across at most three attempts;
- performs exactly one shared bounded provider HTTP call per adapter attempt with explicit timeout and bounded retry delay ownership;
- accepts only HTTP `200` JSON with the strict success parser and discards the validated provider message ID;
- reads only bounded documented Resend error names and an optional matching status code while ignoring provider messages;
- retries timeout/network/open-circuit, standard transient statuses, 5xx, `rate_limit_exceeded`, and `concurrent_idempotent_requests`;
- keeps authentication, validation, sender, quota, invalid-idempotency, security, malformed success, cancellation, unknown errors, and contract drift terminal;
- caps validated `Retry-After` at 30 seconds and exposes injected sleep for deterministic tests;
- throws one constant final error so the existing password-reset service preserves undelivered-token invalidation;
- added deterministic no-network success, retry, terminal, malformed-response, stable-idempotency, delay, configuration-bound, and sensitive-value non-disclosure coverage;
- did not change environment selectors, application composition, source support, readiness, capabilities, routes, database, mobile, credentials, sender/domain, DNS, real delivery, deployment, or activation.

Remaining P5 boundary:

- replace the generic backend delivery selector with the documented `resend` selector while retaining `unavailable` and test-only memory boundaries;
- add strict backend configuration for Resend API key, sender address, trusted app-link base, bounded timeout, and attempts without exposing secret values;
- compose the adapter only in the backend application root through the existing fetch transport;
- update production source-support validation and password-reset readiness only when the complete selected configuration is present and safe;
- preserve separate configured, ready, enabled, and operational states and safe unavailable defaults;
- add deterministic configuration, composition, production-validation, capability/readiness, missing/partial/unsafe setting, and secret-redaction tests without real email;
- complete release-grade app/universal-link source configuration and mobile token/navigation/accessibility coverage, followed later by authorized native-device validation;
- keep sender-domain/DNS setup, provider account and credentials, account/quota evidence, real email delivery, backend deployment, OTA/native builds, and production activation external.

"""
roadmap = replace_section(
    roadmap,
    "### P5 — password-reset product readiness\n",
    "### P6 — deployment templates and runbooks\n",
    roadmap_p5,
    "roadmap P5",
)
roadmap_starter = f"""## New-chat starter prompt

> Continue autonomous work on the Smart Fitness Provider and Release Readiness program. Repositories: mobile `hon4olo/smart-fitness-app`, backend `hon4olo/smart-fitness-backend`. First verify exact current `main` and open PRs in both repositories; read both `AGENTS.md`, mobile `PROJECT_LEARNINGS.md`, `ROADMAP_PROGRESS.md`, `docs/implementation-plan.md`, `docs/roadmap/provider-readiness.md`, `docs/roadmap/release-and-account.md`, mobile password-reset routes/tests, backend password-reset service/delivery/configuration contracts, shared provider HTTP transport, and backend `docs/architecture/resend-password-reset-delivery.md`. P0 through P4 autonomous source preparation are complete. The Resend request/template/parser contract and bounded runtime are complete through backend PR #111 exact green head `{PR111_HEAD}`, merge `{BACKEND_MAIN}`. No Resend account, credential, verified sender/domain, DNS, real email, application-root composition, readiness, deployment, or activation was added. Continue with the smallest complete backend composition/readiness slice: replace the generic delivery selector with the documented `resend` selector, add strict backend-only configuration for API key/sender/trusted app-link base/timeout/attempts, compose the adapter only in the application root through the existing fetch transport, update production source-support validation and password-reset readiness only for complete safe configuration, preserve unavailable defaults and separate configured/ready/enabled/operational states, and add deterministic missing/partial/unsafe/redaction/composition/capability tests without any network call. Do not change mobile app/universal links or activate delivery in the same slice. Preserve generic accepted responses, token hashing, cooldown, expiry/replay rejection, undelivered-token invalidation, all-session revocation, token non-persistence, and privacy boundaries. Work through meaningful bounded backend/mobile/docs PRs, run full blocking CI, inspect review threads, and merge only exact fully green heads. Do not configure credentials, sender domains, DNS, provider accounts, call real providers, deploy backend changes, execute migrations outside CI, schedule workers, activate staging or production, publish OTA/EAS, create/install native builds, enable public media uploads, or activate production password-reset email without direct authorization.
"""
roadmap = roadmap[: roadmap.index("## New-chat starter prompt\n")] + roadmap_starter
roadmap_path.write_text(roadmap)


plan_path = Path("docs/implementation-plan.md")
plan = update_baseline(plan_path.read_text(), "implementation plan")
plan_p5 = f"""## P5 active source boundary

The provider-neutral token/session and mobile forgot/reset foundations remain unchanged. Backend PR #110, exact green head `54fe3bcf57745caddb1177ef6c75453befed407f`, merge `{PR110_MERGE}`, completed the selected Resend request, trusted-link, bilingual-template, idempotency, strict-success-parser, and no-network contract boundary.

Backend PR #111, exact green head `{PR111_HEAD}`, merge `{BACKEND_MAIN}`, completed the production-shaped Resend runtime boundary:

- one prebuilt request and stable idempotency identity across at most three attempts;
- exactly one shared bounded transport call per adapter attempt;
- exact HTTP `200` JSON success validation and discarded provider message ID;
- bounded documented provider error-name classification without reading messages;
- explicit timeout/network/transient/5xx/rate-limit/concurrent-idempotency retry policy;
- terminal authentication, validation, sender, quota, invalid-idempotency, security, cancellation, malformed-success, unknown-error, and contract-drift handling;
- bounded default and `Retry-After` delays with deterministic injected sleep;
- constant final failure preserving existing token invalidation;
- deterministic no-network success/retry/terminal/redaction coverage;
- no factory, environment selector, source-support, readiness, capability, route, database, mobile, credential, real delivery, deployment, or activation change.

Complete the backend Resend composition/readiness boundary next:

- replace `external_http` with the documented `resend` provider selector;
- add strict backend-only environment parsing for API key, sender address, exact trusted reset-route base, timeout, and maximum attempts;
- keep absent settings mapped to the safe unavailable provider and fail partial/unsafe production configuration closed;
- compose the complete runtime only in the application root through the existing fetch transport;
- update source-support validation and password-reset readiness only for the complete selected adapter;
- preserve separate configured, ready, enabled, and operational states so credentials alone cannot activate the mobile capability;
- add deterministic environment, factory, composition, source-support, production-validation, readiness/capability, and secret-redaction tests without network access;
- defer mobile app/universal-link source configuration, provider-account/sender-domain/DNS setup, credentials, real delivery, deployment, native-device validation, and activation.

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

Status: active. The provider-neutral backend token/session foundation and localized mobile forgot/reset source flow exist. The selected Resend contract and production-shaped bounded runtime are merged. Backend selector/configuration/composition/source-support/readiness, release-grade app/universal links, real delivery, and activation remain open.

Merged evidence:

- backend PR #60 exact head: `af192c4fbe48c82f1d8e3ac5c7f020c2949fe72f`;
- backend PR #60 merge: `5aa7fa35b0d3e89fe1e824266fd659d1296a61a3`;
- mobile PR #200 exact head: `5ff6cdb50fe04e35d7294d241e37ea46924c06c2`;
- mobile PR #200 merge: `1b77802bb765a1a3db6b8dcd1f081c210049a2d0`;
- backend PR #110 exact green head: `54fe3bcf57745caddb1177ef6c75453befed407f`;
- backend PR #110 merge: `{PR110_MERGE}`;
- backend PR #111 exact green head: `{PR111_HEAD}`;
- backend PR #111 merge: `{BACKEND_MAIN}`;
- both Resend exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

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
- [x] add the production-shaped Resend runtime through the shared bounded provider HTTP transport;
- [x] add explicit bounded retry ownership and timeout/network/cancellation/rate-limit/idempotency/server/authentication/sender-validation/security/malformed-response mapping;
- [x] preserve token invalidation after final delivery failure through the existing password-reset service boundary;
- [ ] replace `external_http` with the documented `resend` selector and add strict backend environment support;
- [ ] compose the complete adapter in the backend application root through the existing fetch transport;
- [ ] update production source-support validation and password-reset readiness only after complete configuration/factory conformance;
- [x] retain password-reset capability gating in the backend contract and pre-auth mobile navigation.

Next bounded slice:

- add only backend selector/configuration/composition/source-support/readiness for the complete Resend adapter;
- preserve safe unavailable defaults and fail partial or unsafe production configuration closed;
- keep configured, ready, enabled, and operational states separate so credentials alone do not activate product behavior;
- add deterministic environment/factory/composition/production-validation/readiness/capability/redaction tests without network access;
- do not change mobile app/universal links or activate delivery in that backend PR.

External activation later requires a verified sender domain, DNS records, provider account and credentials, backend deployment, production link-domain association, real non-production delivery evidence, physical-device validation, and explicit capability enablement.

"""
provider = replace_section(
    provider,
    "## Phase P5 — password-reset product and delivery readiness\n",
    "## Phase P6 — deployment configuration, policies, and runbooks\n",
    provider_p5,
    "provider P5",
)
provider_path.write_text(provider)
