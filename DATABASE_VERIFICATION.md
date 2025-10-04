# 🔍 Database Verification Queries

Run these queries in your Supabase SQL Editor to verify everything is set up correctly.

## ✅ Verify Table Structure

```sql
-- Check all columns in analysis_history table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'analysis_history'
ORDER BY ordinal_position;
```

**Expected Output:**

```
column_name         | data_type                   | is_nullable | column_default
--------------------+-----------------------------+-------------+---------------------------
id                  | uuid                        | NO          | uuid_generate_v4()
user_id             | uuid                        | YES         | null
type                | text                        | NO          | null
conversation_data   | jsonb                       | YES         | null        ← NEW
image_url           | text                        | YES         | null
result              | text                        | NO          | null
score               | integer                     | YES         | null
feedback            | jsonb                       | YES         | null
created_at          | timestamp with time zone    | YES         | now()
updated_at          | timestamp with time zone    | YES         | now()       ← NEW
```

---

## ✅ Verify Type Constraint

```sql
-- Check type constraint
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_class cl ON cl.oid = c.conrelid
WHERE n.nspname = 'public'
AND cl.relname = 'analysis_history'
AND contype = 'c';  -- Check constraints
```

**Expected Output:**

```
constraint_name              | constraint_definition
-----------------------------+-----------------------------------------------------
analysis_history_type_check  | CHECK ((type = ANY (ARRAY['outfit_score'::text,
                            |        'ai_stylist'::text])))
```

---

## ✅ Verify Indexes

```sql
-- Check indexes on analysis_history
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'analysis_history'
ORDER BY indexname;
```

**Expected Output:**

```
indexname                           | indexdef
------------------------------------+------------------------------------------------
analysis_history_pkey              | CREATE UNIQUE INDEX ... USING btree (id)
idx_analysis_history_user_created  | CREATE INDEX ... USING btree (user_id,
                                   |   created_at DESC)                      ← NEW
idx_analysis_history_user_type     | CREATE INDEX ... USING btree (user_id,
                                   |   type)                                 ← NEW
```

---

## ✅ Verify RLS Policies

```sql
-- Check all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'analysis_history'
ORDER BY policyname;
```

**Expected Output:**

```
policyname                          | cmd    | qual
------------------------------------+--------+-------------------------
Users can delete their own history  | DELETE | (auth.uid() = user_id)
Users can insert their own history  | INSERT | (auth.uid() = user_id)
Users can update their own history  | UPDATE | (auth.uid() = user_id)  ← NEW
Users can view their own history    | SELECT | (auth.uid() = user_id)
```

---

## ✅ Verify Trigger Function

```sql
-- Check trigger function exists
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'update_analysis_history_updated_at';
```

**Expected Output:** Function should exist with BEFORE UPDATE trigger logic.

---

## ✅ Verify Trigger

```sql
-- Check trigger is attached to table
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'analysis_history'
ORDER BY trigger_name;
```

**Expected Output:**

```
trigger_name                          | event_manipulation | action_timing
--------------------------------------+--------------------+--------------
update_analysis_history_updated_at_  | UPDATE             | BEFORE       ← NEW
  _trigger                           |                    |
```

---

## ✅ Test RLS Policies (User Isolation)

```sql
-- Test that users can only see their own data
-- First, insert test data as different users (use your test user IDs)

-- Insert as User A
INSERT INTO public.analysis_history (user_id, type, result, conversation_data)
VALUES
  ('USER_A_UUID', 'outfit_score', 'Test A', '{"test": "A"}'::jsonb);

-- Insert as User B
INSERT INTO public.analysis_history (user_id, type, result, conversation_data)
VALUES
  ('USER_B_UUID', 'outfit_score', 'Test B', '{"test": "B"}'::jsonb);

-- Query as User A (set auth.uid() to USER_A_UUID)
-- Should only see their own record
SELECT * FROM public.analysis_history
WHERE user_id = 'USER_A_UUID';

-- Clean up test data
DELETE FROM public.analysis_history WHERE result IN ('Test A', 'Test B');
```

---

## ✅ Test Auto-Update Trigger

```sql
-- Insert a test record
INSERT INTO public.analysis_history (user_id, type, result, conversation_data)
VALUES
  (auth.uid(), 'outfit_score', 'Trigger Test', '{"test": true}'::jsonb)
RETURNING id, created_at, updated_at;

-- Wait a second, then update it
-- (Replace RECORD_ID with the ID from above)
UPDATE public.analysis_history
SET result = 'Updated Result'
WHERE id = 'RECORD_ID'
RETURNING id, created_at, updated_at;

-- Verify updated_at changed but created_at stayed the same
-- updated_at should be newer than created_at

-- Clean up
DELETE FROM public.analysis_history WHERE result IN ('Trigger Test', 'Updated Result');
```

---

## 📊 Useful Queries for Development

### Count History Entries by Type

```sql
SELECT
    type,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM public.analysis_history
WHERE user_id = auth.uid()
GROUP BY type;
```

### View Recent History

```sql
SELECT
    id,
    type,
    created_at,
    updated_at,
    conversation_data->>'type' as conv_type,
    (conversation_data->>'overallScore')::int as score,
    conversation_data->'feedback'->>'summary' as summary
FROM public.analysis_history
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
```

### Check conversation_data Structure

```sql
SELECT
    id,
    type,
    jsonb_pretty(conversation_data) as formatted_data
FROM public.analysis_history
WHERE user_id = auth.uid()
LIMIT 1;
```

### Find Entries with Images

```sql
SELECT
    id,
    type,
    created_at,
    conversation_data->>'outfitImage' as outfit_image,
    jsonb_array_length(conversation_data->'images') as image_count
FROM public.analysis_history
WHERE user_id = auth.uid()
AND conversation_data->>'outfitImage' IS NOT NULL
ORDER BY created_at DESC;
```

### Check app_settings for save_history toggle

```sql
SELECT
    user_id,
    save_history,
    created_at,
    updated_at
FROM public.app_settings
WHERE user_id = auth.uid();
```

---

## 🧹 Clean Up Queries (Use with Caution!)

### Delete ALL Your History

```sql
-- ⚠️ WARNING: This deletes ALL your history entries
DELETE FROM public.analysis_history
WHERE user_id = auth.uid();
```

### Delete Only Outfit Scores

```sql
DELETE FROM public.analysis_history
WHERE user_id = auth.uid()
AND type = 'outfit_score';
```

### Delete Only AI Stylist History

```sql
DELETE FROM public.analysis_history
WHERE user_id = auth.uid()
AND type = 'ai_stylist';
```

### Delete Old History (Older than 30 days)

```sql
DELETE FROM public.analysis_history
WHERE user_id = auth.uid()
AND created_at < NOW() - INTERVAL '30 days';
```

---

## 🔧 Troubleshooting Queries

### Check if RLS is Enabled

```sql
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'analysis_history';
```

**Expected:** `rowsecurity = true`

### Check Foreign Key Constraint

```sql
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE contype = 'f'
AND conrelid::regclass::text = 'public.analysis_history';
```

**Expected:** `user_id` → `auth.users.id`

### Check Table Permissions

```sql
SELECT
    grantee,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND table_name = 'analysis_history';
```

---

## ✅ All Checks Passed?

If all the above queries return expected results:

- ✅ Database structure is correct
- ✅ Indexes are created
- ✅ RLS policies are active
- ✅ Triggers are working
- ✅ Ready for integration!

---

## 📝 Save These Queries

Keep this file handy for:

- Verifying deployment in production
- Debugging issues
- Monitoring data growth
- Manual data cleanup
- Development testing

---

**Pro Tip:** Run these queries in Supabase SQL Editor or use the Supabase CLI:

```bash
# Connect to your project
supabase db connect

# Then paste any query above
```
