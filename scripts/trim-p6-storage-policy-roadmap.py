from pathlib import Path

ROADMAP_PATH = Path('docs/roadmap/provider-readiness.md')

old = '''Completed storage and immutable-delivery policy boundary:

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

new = '''Completed storage and immutable-delivery policy boundary:

- separate private quarantine/moderation-master and immutable public-delivery resources or enforceable namespaces;
- blocked anonymous origin access with HTTPS, encryption at rest, least-privilege identities, exact CORS origins, and CDN-mediated public reads;
- exact adapter-aligned prefixes, metadata, bounded sizes, conditional no-overwrite writes, SHA-256 content addressing, immutable JPEG caching, and read-only CDN methods;
- application-owned deletion, retention, appeals, and legal holds; no independent age-based expiry; placeholder-only staging/production translation with deterministic secret-free coverage.

Next bounded slice — sender and link-domain infrastructure documentation:

- document placeholder-only sender-domain DNS ownership, verification, rotation, and rollback requirements;
- document AASA and `assetlinks.json` hosting, path scope, application identifiers, signing fingerprints, caching, and environment separation;
- document only required provider callbacks, disabled by default; domain/DNS changes, verification, association deployment, real email, native builds, and device validation remain external.
'''

text = ROADMAP_PATH.read_text()
count = text.count(old)
if count != 1:
    raise SystemExit(f'expected one P6 policy detail block, found {count}')
ROADMAP_PATH.write_text(text.replace(old, new, 1))
