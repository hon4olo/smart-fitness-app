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
    '- mobile `main`: `19bb637d900941e5721d63a8e673089c27d11ad1`;\n'
    '- backend `main`: `bad69c42325e7156215e7fdba45962ade3372ef1`;',
    '- mobile `main`: `25bbefa7621fefa0ec6bafafc34aec867f3638f1`;\n'
    '- backend `main`: `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;',
    'implementation baseline',
)
evidence_anchor = (
    '- backend PR #113 merge: '
    '`bad69c42325e7156215e7fdba45962ade3372ef1`;\n'
)
evidence = evidence_anchor + (
    '- mobile PR #385 exact green head: '
    '`9b7605bf53e3b4a6ca1f437f1ff89f44ade1c821`;\n'
    '- mobile PR #385 merge: '
    '`25bbefa7621fefa0ec6bafafc34aec867f3638f1`;\n'
    '- backend PR #114 exact green head: '
    '`9e9408ec87a6c6fc0786cd66c8272b502dbb5790`;\n'
    '- backend PR #114 merge: '
    '`afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;\n'
)
plan = replace_once(plan, evidence_anchor, evidence, 'implementation evidence')
plan_section = '''## P6 current source boundary

Backend PR #113, exact green head `3e366e803f91d4d563d0b1e70cc189381534cd18`, merge `bad69c42325e7156215e7fdba45962ade3372ef1`, completed the fail-closed environment-template and staging/production configuration-matrix slice:

- expanded `.env.example` and `.env.production.example` with the complete managed-media, Rekognition, worker, and Resend configuration surface;
- kept every product enablement flag `false`, every production provider selector `unavailable`, and every provider credential blank by default;
- documented explicit environment targeting, required secret names, cross-repository reset-link matching, and fail-closed preparation order;
- added deterministic drift and credential-shape coverage.

Backend PR #114, exact green head `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`, merge `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`, completed the storage and immutable-delivery policy-template slice:

- added provider-neutral private managed-media storage, immutable delivery-origin, and CDN-origin design contracts;
- aligned exact private and public prefixes, bounded object sizes, required metadata, SHA-256 content addressing, conditional no-overwrite writes, and immutable cache controls with the implemented S3-compatible adapters;
- required blocked origin public access, HTTPS, encryption at rest, exact CORS origins, least-privilege backend and CDN identities, and separation of private storage from public delivery;
- kept deletion, retention deadlines, appeals, and legal holds application-owned and prohibited independent age-based expiration for managed prefixes;
- documented explicit staging/production translation and external application gates without provider-specific apply commands;
- added deterministic parsing, contract-alignment, unsafe-public-access, placeholder, and credential-shape coverage;
- passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

The active P6 boundary is now sender and link-domain infrastructure documentation:

- document verified sender-domain DNS requirements for Resend without selecting or configuring a real domain;
- document Apple App Site Association and Android Digital Asset Links ownership, hosting, path, application-ID, and signing-certificate requirements;
- document provider callback requirements only where a selected provider contract actually needs them;
- keep all examples placeholder-only, non-destructive, and explicitly scoped to staging or production;
- leave DNS mutation, domain verification, association-file deployment, provider-account changes, real delivery, native builds, and physical-device validation external.

No provider account, credential, bucket, CDN, domain, DNS, association-file deployment, policy application, real provider call, backend deployment, worker startup, environment activation, capability enablement, OTA/EAS publication, native build, or device installation was performed.
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

Status: active. Environment templates, the staging/production configuration matrix, and provider-neutral storage/CDN policy templates are source-complete. Sender-domain and link-domain infrastructure documentation is next.

Merged evidence:

- backend PR #113 exact green head: `3e366e803f91d4d563d0b1e70cc189381534cd18`;
- backend PR #113 merge: `bad69c42325e7156215e7fdba45962ade3372ef1`;
- backend PR #114 exact green head: `9e9408ec87a6c6fc0786cd66c8272b502dbb5790`;
- backend PR #114 merge: `afd5c2ac6fafb3879dfe2822fb6a7a659ba58aa5`;
- both exact heads passed lint, formatting, TypeScript build, production configuration validation, migrations and idempotency, migrated-schema integration, PostgreSQL Social API integration, full Vitest, and production startup/health.

- [x] expand `.env.example` without adding secrets;
- [x] document staging and production configuration matrices and required secret names;
- [x] prepare private bucket, public-delivery bucket or namespace, CORS, lifecycle, encryption, public-access, and CDN-origin policy templates;
- [ ] document sender-domain DNS, link-domain association, and provider callback requirements where applicable;
- [ ] define migration order, backend rollout order, worker startup order, capability enablement order, and rollback order;
- [ ] add smoke scripts for configuration validation, signed upload, processing, delivery, deletion, password reset, and capability status using non-production fixtures;
- [ ] document key rotation, provider outage, emergency media disable, cleanup pause, legal hold, and rollback procedures;
- [ ] keep all commands non-destructive by default and require explicit environment targeting.

Completed storage and immutable-delivery policy boundary:

- separate private quarantine/moderation-master and immutable public-delivery resources or enforceable namespaces;
- blocked anonymous origin access, HTTPS and encryption-at-rest requirements, least-privilege identities, exact CORS origins, and CDN-mediated public reads;
- exact adapter-aligned prefixes, metadata, bounded sizes, conditional no-overwrite writes, SHA-256 content addressing, immutable JPEG cache control, and read-only CDN methods;
- application-owned deletion, retention, appeal, and legal-hold behavior with no independent age-based expiration for managed prefixes;
- placeholder-only staging/production translation and application gates with deterministic secret-free conformance coverage.

Next bounded slice — sender and link-domain infrastructure documentation:

- document required sender-domain DNS record classes, ownership, verification, rotation, and rollback evidence without real values;
- document AASA and `assetlinks.json` hosting, content-type, cache, path scoping, application identifiers, signing-certificate fingerprints, and environment separation;
- identify provider callbacks only when required by the selected public provider contract and keep callback endpoints disabled by default;
- add deterministic placeholder, path-scope, cross-environment isolation, and secret-free documentation tests;
- keep domain purchase, DNS mutation, sender verification, association-file deployment, callback registration, real email, native build, and device validation external.
'''
roadmap = replace_section(
    roadmap,
    '## Phase P6 — deployment configuration, policies, and runbooks',
    '## Phase P7 — explicit sync conflict-choice contract',
    roadmap_section,
    'provider roadmap P6 section',
)
roadmap_path.write_text(roadmap)
