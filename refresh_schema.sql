-- Run this in the Supabase SQL Editor to force-refresh the schema cache
-- if you are seeing PGRST204 errors about missing columns.

-- 1. Explicitly verify the column existence (Optional check)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'scheduled_classes';

-- 2. Force PostgREST to reload the schema cache
NOTIFY pgrst, 'reload schema';
