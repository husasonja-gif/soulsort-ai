# ⚠️ MIGRATION REQUIRED

## Dealbreaker Engine Migration

To use the new dealbreaker engine, you **must** run the following migration:

### Migration File
`supabase/migrations/009_add_dealbreaker_hits.sql`

### How to Run

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/009_add_dealbreaker_hits.sql`
4. Paste and run the SQL

The migration adds the `dealbreaker_hits` JSONB column to the `requester_assessments` table.

### Error You'll See Without This Migration

```
Could not find the 'dealbreaker_hits' column of 'requester_assessments' in the schema cache
Error code: PGRST204
```

### Verification

After running the migration, you can verify it worked by running:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'requester_assessments' 
AND column_name = 'dealbreaker_hits';
```

You should see a row with `column_name = 'dealbreaker_hits'` and `data_type = 'jsonb'`.





