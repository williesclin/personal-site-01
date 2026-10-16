# Recovery readiness

Reviewed: 2026-10-16

Recovery is fail-closed. A version history, successful build or healthy database does not prove that data can be restored. `data/recovery-readiness.json` is the public, non-secret record used by `/api/data-status`; `app/recovery-readiness.mjs` validates it and derives readiness instead of trusting a manually entered ready flag.

## Evidence inventory

| Scope | Evidence available | Missing evidence | Current conclusion |
| --- | --- | --- | --- |
| Public source snapshots | Git history, snapshot validators, current production health metadata | Timed restore drill | Source history verified; not a database backup |
| Cloudflare Workers | Versioned deployments for both production Workers | Isolated rollback and forward-recovery record; documented retention | Rollback capability exists; recovery not tested |
| Membership database | Active Supabase project and migration history | Current logical export, checksum, off-site retention, recovery point and restore timing | Blocked |
| Research database | Active Supabase project and migration history | Current logical export, checksum, off-site retention, recovery point and restore timing | Blocked |

Both Supabase projects are currently on the Free organization tier. Supabase documents automatic daily backups for Pro, Team and Enterprise projects and recommends regular CLI dumps plus off-site backups for Free projects. No export or restore is performed by this change.

## Safe restore acceptance

Do not restore over production for acceptance. Use a disposable target containing no unique production-only data and record all of the following:

1. Export creation time, source project, schema coverage, encrypted storage location, retention and SHA-256.
2. Restore start/end time, tool versions, target identity and operators.
3. Migration parity, table counts, representative foreign-key checks and required functions/triggers.
4. Authentication isolation and RLS checks proving one user cannot read another user's rows.
5. Application smoke tests for sign-in, membership lookup, account save/restore and research reads.
6. Destruction of the disposable target after evidence is retained.

RPO and RTO stay `undefined` until export cadence and measured restore duration are available. A JSON manifest approval, successful query or branch existence is not a restore test.

## Paid-release rule

Paid Research and Pro access remain closed while recovery readiness is false. This recovery status is supplementary to, not a replacement for, the existing product, payment, rights, security and human-review release gates.
