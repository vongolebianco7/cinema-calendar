# External data freshness evidence

`python scripts/audit_data_freshness.py --output freshness-report.json` is an offline audit. It does not query providers or refresh any stored observations.

For `streaming-availability`, `freshness` describes the cached titles' individual `checked_at` timestamps, using the existing seven-day observation audit. A recently written snapshot does not make its older cached observations current.

| Field | Meaning |
|---|---|
| `freshness_scope: title_observations` | The status describes per-title observations, not the batch timestamp |
| `freshness: fresh` | Every stored observation is within seven days |
| `freshness: partial` | Some observations are current, some stale/unknown |
| `freshness: stale` | There are stored observations, but none is current |
| `freshness: unknown` | No title observations are stored |
| `observations` | Existing audit totals, fresh/stale counts, missing/invalid timestamps and evaluation time |
| `snapshot_freshness` | Whether the snapshot's `generated_at` satisfies the registry's batch-update SLA |
| `enforcement_scope: snapshot_timestamp` | Required failure checks retain the existing batch-update SLA; partial coverage is reported separately |

Malformed observation data fails the enforced audit. An expired snapshot also fails, even if its individual title observations happen to be current. Partial coverage does not masquerade as a failed scheduled batch, and a successful batch does not masquerade as complete provider coverage.

Other registry categories retain their snapshot timestamp status and enforcement. Disabled sources remain explicitly disabled; this change does not grant acquisition permission, change the 60-title daily observation limit, call APIs, or alter published availability data. UI availability expiry remains independent.

On 2026-10-18 the audited cache contained 355 observations, 79 current and 276 stale/unchecked. This is cached observation coverage, not a catalogue-wide provider availability guarantee.
