from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected one match, found {count}')
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
        raise SystemExit(f'{label}: start marker missing')
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise SystemExit(f'{label}: end marker missing')
    return text[:start_index] + replacement.rstrip() + '\n\n' + text[end_index:]


plan_path = Path('docs/implementation-plan.md')
plan = plan_path.read_text()
plan = replace_once(
    plan,
    '- mobile `main`: `25bbefa7621fefa0ec6bafafc34aec867f3638f1`;\n'
    '- backend `main`: `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;',
    '- mobile `main`: `32249cf88781b75e3f50c274510bff87b68250ad`;\n'
    '- backend `main`: `288425d9e8608c56f814af74274301c3940a371c`;',
    'implementation baseline',
)
evidence_anchor = (
    '- backend PR #114 merge: '
    '`afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;\n'
)
evidence = evidence_anchor + (
    '- mobile PR #386 exact green head: '
    '`8076e93c43e53cc0b9e460866745c2baebfd5038`;\n'
    '- mobile PR #386 merge: '
    '`32249cf88781b75e3f50c274510bff87b68250ad`;\n'
    '- backend PR #116 exact green head: '
    '`12ba41f2176079fbb4fbe13fc07e3016c16f5049`;\n'
    '- backend PR #116 merge: '
    '`288425d9e8608c56f814af74274301c3940a371c`;\n'
)
plan = replace_once(plan, evidence_anchor, evidence, 'implementation evidence')
plan_section = '''## P6 current source boundary

Backend PR #113, exact green head `3e366e803f91d4d563d0b1e70cc189381534cd18`, merge `bad69c42325e7156215e7fdba45962ade3372ef1`, completed fail-closed environment templates and the staging/production configuration matrix.

Backend PR #114, exact green head `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`, merge `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`, completed provider-neutral private-storage, immutable-delivery, CORS, lifecycle, encryption, public-access, and CDN-origin policy contracts aligned with the implemented S3-compatible adapters.

Backend PR #116, exact green head `12ba41f2176079fbb4fbe13fc07e3016c16f5049`, merge `288425d9e8608c56f814af74274301c3940a371c`, completed sender and link-domain association source preparation:

- added placeholder-only Resend DKIM/SPF/MX, Apple AASA, and Android Digital Asset Links templates;
- fixed the source contract to `/auth/reset-password`, `com.dzahard28.smartfitnessapp`, external Apple Team ID, and external Android release signing fingerprint;
- documented exact HTTPS/no-redirect hosting, staging/production isolation, privacy-safe browser fallback, rollback, and no-token evidence requirements;
- kept the current Resend integration send-only with no callback route, webhook secret, provider-event persistence, or callback-based readiness claim;
- added deterministic route, identifier, wildcard-rejection, placeholder, callback-disablement, and credential-shape coverage;
- passed the complete blocking Backend CI.

The active P6 boundary is now rollout and rollback ordering:

- define exact migration, backend, worker, capability-enablement, verification, disablement, and rollback order;
- require explicit staging or production targeting and fail closed before each irreversible or externally visible transition;
- preserve current disabled defaults and content-free evidence requirements;
- leave migration execution outside CI, deployment, worker startup, DNS, real provider calls, native builds, and capability activation external.

No provider account, credential, infrastructure, DNS, association deployment, callback registration, real delivery, backend deployment, worker startup, environment activation, capability enablement, OTA/EAS publication, native build, or device installation was performed.
'''
plan = replace_section(
    plan,
    '## P6 current source boundary',
    '## Execution rules',
    plan_section,
    'implementation P6 section',
)
plan_path.write_text(plan)

roadmap_path = Path('docs/roadmap/provider-readiness.md')
roadmap = roadmap_path.read_text()
roadmap_section = '''## Phase P6 — deployment configuration, policies, and runbooks

Status: active. Environment, storage/CDN policy, sender-domain, and link-association source preparation is complete. Rollout and rollback ordering is next.

Merged evidence:

- backend PR #113 exact green head `3e366e803f91d4d563d0b1e70cc189381534cd18`, merge `bad69c42325e7156215e7fdba45962ade3372ef1`;
- backend PR #114 exact green head `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`, merge `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;
- backend PR #116 exact green head `12ba41f2176079fbb4fbe13fc07e3016c16f5049`, merge `288425d9e8608c56f814af74274301c3940a371c`;
- all exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

- [x] expand `.env.example` without adding secrets;
- [x] document staging and production configuration matrices and required secret names;
- [x] prepare private bucket, public-delivery namespace, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- [x] document sender-domain DNS, link-domain association, and provider callback requirements where applicable;
- [ ] define migration order, backend rollout order, worker startup order, capability enablement order, and rollback order;
- [ ] add smoke scripts for configuration validation, signed upload, processing, delivery, deletion, password reset, and capability status using non-production fixtures;
- [ ] document key rotation, provider outage, emergency media disable, cleanup pause, legal hold, and rollback procedures;
- [ ] keep all commands non-destructive by default and require explicit environment targeting.

Completed sender and link-domain boundary:

- placeholder-only Resend DKIM/SPF/MX, Apple AASA, and Android Digital Asset Links templates with exact current route and app identifiers;
- HTTPS/no-redirect hosting, environment isolation, signing-input, browser-fallback, rollback, and content-free evidence requirements;
- send-only Resend integration with no callback route, webhook secret, event persistence, or callback-based readiness claim;
- deterministic path, identifier, wildcard, placeholder, callback, and credential-shape coverage.

Next bounded slice — rollout and rollback order:

- define preflight, migration, backend, worker, capability, verification, disablement, and rollback sequence;
- distinguish staging rehearsal from production execution and require explicit target confirmation at every command boundary;
- block capability enablement until provider readiness, workers, association files, smoke evidence, and rollback ownership are confirmed;
- keep actual deployment, migration execution outside CI, worker scheduling, provider calls, DNS, native builds, and activation external.
'''
roadmap = replace_section(
    roadmap,
    '## Phase P6 — deployment configuration, policies, and runbooks',
    '## Phase P7 — explicit sync conflict-choice contract',
    roadmap_section,
    'provider roadmap P6 section',
)
roadmap_path.write_text(roadmap)
