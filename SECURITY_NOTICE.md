# SECURITY NOTICE

⚠️ **Important:** Since the service role key was previously hardcoded in `check_staff.js` (now deleted), if this repository has ever been pushed to a public remote, you should **rotate your Supabase service role key** via the Supabase dashboard immediately.

This applies even if the remote repository is currently private but was once public, or if unauthorized individuals had access to the codebase at any time.

## How to rotate your key:
1. Log in to your Supabase Dashboard.
2. Go to your Project Settings.
3. Navigate to **API** under Configuration.
4. Locate the **service_role** secret and generate a new key/rotate it.
5. Update your local `.env.local` and any deployment environment variables (e.g. Vercel, Docker) with the new key.
