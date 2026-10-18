# Recovery export evidence runbook

Reviewed: 2026-10-18

This runbook prepares evidence for the two blocked database-export gates. It does not restore production, enable billing or make recovery readiness pass automatically. Run it only in an interactive, authorized operator session with the existing Supabase projects and an approved encrypted off-site destination.

Supabase documents that Free projects should regularly export data with `supabase db dump` and maintain off-site backups. The CLI's default dump excludes data, custom roles and Supabase-managed `auth`, `storage` and extension schemas; schema, data and roles therefore need separate exports, and the exclusions must remain explicit.

## Per-project export

Link the CLI to one existing project at a time. Never paste credentials into chat, commit output files or reuse the same work directory for both projects without checking the linked project first.

```sh
supabase db dump --linked --file schema.sql
supabase db dump --linked --data-only --file data.sql
supabase db dump --linked --role-only --file roles.sql
```

For each file, require a non-zero byte count, calculate SHA-256, encrypt before leaving the controlled machine, and copy the encrypted artifact to an approved off-site destination. Record only the encrypted artifact's checksum and size. The public repository must never receive database contents, connection strings, credentials, storage locators or a private evidence manifest.

## Private evidence contract

Keep a private JSON manifest with:

- `version: 1` and a UTC `generatedAt` instant;
- encrypted, off-site storage classification and at least seven days of retention;
- exactly two scopes: `membership` and `research`;
- export and recovery-point timestamps for each scope;
- the explicit managed-schema exclusions `auth`, `extensions`, `storage`;
- encrypted `schema`, `data` and `roles` artifacts, each with positive bytes and a SHA-256 checksum.

Validate it without printing secrets:

```sh
npm run verify:recovery-export -- /private/path/recovery-export-evidence.json
```

The verifier fails if either project is missing, any artifact is stale (default: older than 36 hours), empty, unencrypted or lacks a valid checksum, or if storage is not marked off-site. Passing this preflight proves only that export evidence is structurally complete. Recovery remains blocked until an isolated restore, row-count reconciliation, RLS/auth checks and measured restore duration are recorded.

## Next acceptance

1. Use a disposable target that contains no unique production-only data.
2. Restore roles, schema and data in the documented order; account for the managed-schema exclusions explicitly.
3. Reconcile representative table counts and required functions, triggers and migrations.
4. Verify that one user cannot read another user's `memberships` or `research_state` rows.
5. Exercise sign-in, membership lookup, saved research restore and authenticated research reads.
6. Record start/end timestamps; only then propose RPO and RTO values.

Sources: [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups) and [Supabase CLI `db dump`](https://supabase.com/docs/reference/cli/supabase-db-dump).
