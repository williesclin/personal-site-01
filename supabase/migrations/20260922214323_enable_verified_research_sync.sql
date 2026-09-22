-- Enabled only after successful main-branch import and idempotent replay.
do $$ begin
 if not exists(select 1 from quantpath_ops.sync_runs where status='success') or not exists(select 1 from quantpath_ops.sync_runs where status='unchanged') then raise exception 'Verify main synchronization and replay first';end if;
 perform cron.schedule('quantpath-research-sync','*/15 * * * *','select quantpath_ops.sync_research_from_github();');
end $$;
