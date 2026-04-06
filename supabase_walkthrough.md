# Supabase Setup Guide - FreelanceHub

To get your marketplace running with real data, messaging, and accounts, follow these steps exactly.

## 1. Create a Project
1. Go to [database.new](https://database.new) and create a new project.
2. Store your **Project Password** safely.

## 2. Initialize the Database
1. In your Supabase Dashboard, go to the **SQL Editor** (the `>_` icon on the left).
2. Create a "New Query".
3. Copy and paste the entire contents of [supabase_schema.sql](file:///c:/Projects/tecWebsite/supabase_schema.sql) into the editor.
4. Click **Run**. This establishes your Profiles, Services, Messages, and Orders structure with Role-Based Security.

## 3. Configure Environment Variables
1. Go to **Project Settings** > **API**.
2. Copy your `Project URL` and `anon public` key.
3. In your project's root directory, update your `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Authentication Logic
Now that the backend is set up, you can build your Login/Signup page.
- Use `supabase.auth.signInWithPassword` or OAuth.
- Upon signup, Supabase will handle the `auth.users` row.
- You'll want to add a database trigger in Supabase later to automatically create a row in the `public.profiles` table whenever a user signs up.

## 5. Fetching Data
You can now use the `supabase` client in your components:
```typescript
const { data, error } = await supabase.from('services').select('*');
```

---
> [!TIP]
> If you're building a real-time chat, remember to enable **Supabase Realtime** for the `messages` table in the Supabase Dashboard under Database > Replication.
