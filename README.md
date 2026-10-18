# QUIZ CLASH ⚡
A responsive cyber-neon quiz battle website.

## Included
- `index.html`: playable timed quiz, multiple categories, speed bonus scoring, room-code UI, leaderboard.
- `supabase/schema.sql`: Supabase tables, starter RLS policies and Realtime publication setup.
- `.github/workflows/pages.yml`: deploys the static site to GitHub Pages when pushed to main.

## Deploy on GitHub Pages
1. Open repository **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. The workflow deploys on the next push to `main`; you can also run it from Actions.
4. Open the Pages URL shown under Settings → Pages.

## Enable Supabase online rooms
1. Create a Supabase project.
2. In **SQL Editor**, run `supabase/schema.sql`.
3. Open the website, expand **Connect Supabase**, enter your project URL and public anon/publishable key, then connect.
4. Friends must use the same Supabase project URL/key on their browsers. Check that Realtime is enabled for `quiz_rooms` and `quiz_players`.

Never expose a Supabase service-role key in browser code.

## Honest prototype limitations
- Demo mode works without Supabase but rooms are local UI only and do not connect separate devices.
- Supabase room/player records and realtime change subscriptions are implemented, but gameplay currently runs independently in each browser; the same server-authoritative question sequence and synchronized round progression are not implemented yet.
- The browser currently computes score updates. The permissive starter policies make prototyping easier but are not safe for a competitive public launch. A player could spoof scores or room state. Before public competition, require authenticated identities and move question delivery, answer validation, timer control and scoring into trusted Supabase Edge Functions or another server; tighten RLS so clients cannot update arbitrary scores/state.
