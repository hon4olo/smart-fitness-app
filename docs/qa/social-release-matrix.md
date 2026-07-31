# Social physical-device release matrix

Updated: 2026-07-31

## Purpose

This matrix defines the manual release evidence required for the Social MVP on a physical iPhone. Source CI, PostgreSQL integration tests, Expo export, and Expo Doctor do not count as physical-device validation.

The matrix must be executed only against an explicitly approved non-production environment with the matching backend migrations applied. It does not authorize a backend deployment, OTA publication, native build, TestFlight release, production activation, or credentials change.

## Required test identities

Use disposable test accounts with no real health, nutrition, recovery, limitation, measurement, authentication, Coach, or private workout data beyond the minimum fixtures required for each scenario.

- **Account A — viewer:** public Social profile.
- **Account B — target:** public Social profile with one published workout and one comment.
- **Account C — private:** private Social profile.
- **Account D — blocked side:** public Social profile used for symmetric block checks.
- **Operator:** approved database-backed moderation CLI access; no mobile staff/admin interface exists.

Record the app commit, backend commit, environment, device model, iOS version, build/update identifier, test account aliases, and timestamp before execution.

## Pass criteria

A scenario passes only when:

- the visible UI matches the server-authoritative state after relaunch;
- no restricted/private/deleted target is exposed through an alternate Social screen;
- no private application data appears in Social payloads or UI;
- expected recovery remains available;
- no crash, navigation trap, stale success state, or infinite loading state occurs;
- screenshots or screen recordings contain only disposable test data.

## Matrix

| ID | Scenario | Setup | Expected device result | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| SOC-01 | Public profile lookup | A searches B | B profile loads with bounded public fields only | Screenshot + request log | Pending |
| SOC-02 | Private profile denied | A searches C without accepted follow | Existing localized private/not-available state; no bio/posts leak | Recording + request log | Pending |
| SOC-03 | Private request recovery | A requests C; C opens incoming requests | Requester remains reviewable; approve/reject controls work | Recording | Pending |
| SOC-04 | Viewer-owned block | A blocks D, relaunches, opens D | D remains unavailable and viewer-owned unblock recovery remains reachable | Recording | Pending |
| SOC-05 | Reverse-side block | D blocks A; A opens D | Generic unavailable state; no reverse-block disclosure | Screenshot + request log | Pending |
| SOC-06 | Block cleanup | A and D have follow/reaction/comment state before block | Relations and cross-user interactions disappear after block and remain absent after relaunch | Recording + DB verification | Pending |
| SOC-07 | Deleted workout post | B deletes own published snapshot while A has detail open | Detail becomes bounded deleted/not-found state; no crash or stale content after retry | Recording | Pending |
| SOC-08 | Deleted comment | B deletes own comment while A has comments open | Comment disappears; stale delete/report actions fail closed | Recording | Pending |
| SOC-09 | Profile report submission | A reports B with one bounded reason | One success receipt, no report ID/status, no automatic content removal | Recording + DB count | Pending |
| SOC-10 | Post report submission | A reports B's post twice | Same bounded success behavior; one deduplicated report row | Recording + DB count | Pending |
| SOC-11 | Comment report submission | A reports B's comment | Success receipt; comment remains until explicit operator action | Recording + DB count | Pending |
| SOC-12 | Report rate limit | A exceeds approved test cap | Localized bounded rate-limit recovery; no extra report rows | Recording + DB count | Pending |
| SOC-13 | Restricted profile | Operator actions B profile report, then explicitly hides target | B absent from lookup, relationship lists, feed, notifications, and reaction counts; B Social writes fail closed | Recording across all surfaces + DB audit | Pending |
| SOC-14 | Restricted profile relaunch | Relaunch B and A after SOC-13 | Restriction persists; B private fitness/authentication data remain intact; username remains reserved | Recording + DB verification | Pending |
| SOC-15 | Restored profile | Reopen/dismiss source report and explicitly restore B | B reappears across Social surfaces after refresh/relaunch; one restore audit row | Recording + DB audit | Pending |
| SOC-16 | Restricted post | Explicitly hide only B's reported workout post | Post absent from detail/profile list/feed/comments/reactions/notifications; B profile and other posts remain | Recording + DB audit | Pending |
| SOC-17 | Restored post | Explicitly restore SOC-16 target | Same immutable post returns without republishing or rewriting snapshot | Recording + DB audit | Pending |
| SOC-18 | Restricted comment | Explicitly hide only B's reported comment | Comment and related notification disappear; parent post and B profile remain | Recording + DB audit | Pending |
| SOC-19 | Restored comment | Explicitly restore SOC-18 target | Comment returns after refresh/relaunch with one restore audit row | Recording + DB audit | Pending |
| SOC-20 | Restricted target repeat report | A attempts to report a currently restricted profile/post/comment | Existing bounded unavailable/not-found behavior; moderation state not disclosed | Recording + request log | Pending |
| SOC-21 | Account deletion cleanup | Delete B account after report/restriction history exists | Public Social content, reports/restrictions, and dependent audit rows follow approved cascade semantics | Recording + DB verification | Pending |
| SOC-22 | Offline recovery | Disconnect during feed, notification, comment, and report operations | Localized offline state; no false success; safe retry after reconnect | Recording | Pending |
| SOC-23 | Expired session recovery | Expire A session during Social read and write operations | Existing localized session-expired flow; no duplicate writes after re-authentication | Recording + DB count | Pending |
| SOC-24 | Community Guidelines | Open from Profile without a Social profile | EN/RU content renders, scrolls, and returns correctly; no authentication dependency | Recording | Pending |

## Cross-surface restriction sweep

For SOC-13, SOC-16, and SOC-18, verify every applicable entry point rather than only the originally reported screen:

- exact-username search;
- followers, following, incoming requests, and outgoing requests;
- following feed and pull-to-refresh;
- profile workout-post list;
- workout-post detail;
- reaction state/count;
- comments and pagination;
- notifications and notification navigation;
- report action;
- relaunch and account switch.

A target exposed through any alternate entry point is a release-blocking failure.

## Evidence record

For each completed scenario, record:

```text
Scenario ID:
Date/time:
Tester:
Device/iOS:
Mobile commit:
Backend commit:
Environment:
Build/update ID:
Result: PASS | FAIL | BLOCKED
Evidence location:
Observed error code/state:
Notes:
```

Do not attach production credentials, access tokens, real email addresses, database URLs, report evidence containing real users, or private application data.

## Remaining release blockers

Broad release remains blocked until:

- every required matrix row is PASS or explicitly waived through a documented product/security decision;
- legal Terms of Service and Privacy Policy are reviewed and approved for the intended jurisdictions;
- the approved environment has the required backend migrations and operational access controls;
- no unresolved critical/high Social privacy, authorization, moderation, crash, or data-loss defect remains.
