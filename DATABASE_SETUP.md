# GydsChain Database Setup Guide

## 1. Set Up Your PostgreSQL Database

Use any PostgreSQL 14+ provider (Supabase, Neon, Railway, self-hosted, etc.)

### Upload Schema
Execute these SQL files in order on your database:

1. **`sql/001_schema.sql`** — Creates all tables, indexes, RLS policies, triggers, and helper functions
2. **`sql/002_seed_data.sql`** — Inserts sample development data

### Using psql:
```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f sql/001_schema.sql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DB -f sql/002_seed_data.sql
```

### Using Supabase Dashboard:
1. Go to **SQL Editor**
2. Paste contents of `sql/001_schema.sql` → Run
3. Paste contents of `sql/002_seed_data.sql` → Run

## 2. Configure Environment Variables

Create a `.env` file in the project root (or set in your hosting provider):

```env
VITE_DB_API_URL=https://your-project.supabase.co
VITE_DB_API_KEY=your-anon-public-key
```

### For Supabase:
- `VITE_DB_API_URL` = Your project URL (e.g., `https://abcdef.supabase.co`)
- `VITE_DB_API_KEY` = Your **anon/public** key (Settings → API → anon key)

### For PostgREST:
- `VITE_DB_API_URL` = Your PostgREST base URL
- `VITE_DB_API_KEY` = Your JWT token for auth

### For custom REST API:
- `VITE_DB_API_URL` = Your API base URL
- `VITE_DB_API_KEY` = Your API key
- Ensure your API follows the PostgREST query format (e.g., `?column=eq.value`)

## 3. Verify Connection

Once configured, the app will automatically:
- Fetch tokens, transactions, and leaderboard data from the database
- Persist new token creations, burns, swaps, and liquidity operations
- Show real data instead of mock data

Check the browser console for `[DB]` prefixed messages to debug connectivity.

## 4. RLS Policies

The schema includes RLS with public read access for tokens, leaderboard, and analytics.
For write operations, you may need to add INSERT/UPDATE policies matching your auth setup.

### Example: Allow inserts with API key auth
```sql
CREATE POLICY "API inserts tokens" ON public.tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "API inserts transactions" ON public.transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "API inserts burns" ON public.burns FOR INSERT WITH CHECK (true);
CREATE POLICY "API inserts pools" ON public.liquidity_pools FOR INSERT WITH CHECK (true);
CREATE POLICY "API inserts swaps" ON public.swap_history FOR INSERT WITH CHECK (true);
CREATE POLICY "API inserts users" ON public.users FOR INSERT WITH CHECK (true);
```
