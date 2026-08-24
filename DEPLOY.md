# Deploying to Vercel

## Deployments

| | Convex | Clerk |
| --- | --- | --- |
| Local dev | `dev/mabsstudiodev` — `beloved-ferret-652` | development instance |
| Production | **`prod` — `superb-ant-220`** | see the warning below |

Production Convex is already live: functions and indexes deployed,
`CLERK_JWT_ISSUER_DOMAIN` set, and seeded with the 4 real services and 34
gallery items.

---

## 1. Build command — already committed

`vercel.json` sets it:

```
npx convex deploy --cmd 'npm run build'
```

It lives in the repo rather than the Vercel UI because a plain `npm run build`
fails the deploy: the public pages prerender from Convex
(`lib/public-data.ts`), so without this the build has no
`NEXT_PUBLIC_CONVEX_URL` and dies on `/services`. `vercel.json` also takes
precedence over any command set in the dashboard, so the two cannot drift.

Do **not** set `NEXT_PUBLIC_CONVEX_URL` by hand — the command supplies it, and
a stale hand-set value would silently point the live site at the dev database.

## 2. Environment variables

Vercel → Settings → Environment Variables:

| Variable | Value | Notes |
| --- | --- | --- |
| `CONVEX_DEPLOY_KEY` | *Production* deploy key | Convex dashboard → **prod** (`superb-ant-220`) → Settings → Deploy keys. **Scope it to the Production environment only** — see below. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_…` | From Clerk → API keys |
| `CLERK_SECRET_KEY` | `sk_…` | Secret — Vercel only, never committed |
| `GMAIL_USER` | the sending Gmail address | Booking emails |
| `GMAIL_APP_PASSWORD` | Gmail app password | Secret |
| `BOOKING_TO_EMAIL` | studio inbox | Where requests land |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://mabsstudio.com` | Drives Open Graph, sitemap, robots. Falls back to Vercel's production URL, then `mabsstudio.com`. |

`.env.local` is gitignored, so none of these reach the repo — they must be
entered in Vercel.

## 3. Scope the deploy key, or previews will overwrite production

Add `CONVEX_DEPLOY_KEY` to the **Production** environment only. A Production
key present in Preview would make every preview build deploy its functions to
the live database.

If you want working previews, generate a separate **Preview** deploy key in the
Convex dashboard and add it under the Preview environment. Convex then spins up
a throwaway backend per branch. Without one, preview builds fail — which is the
safe default.

## 4. Clerk is still a development instance

The current keys are `pk_test_` / `sk_test_`. A Clerk **development** instance
will function on a Vercel URL, but it is not meant for real traffic: relaxed
session security, low rate limits, and a "Development mode" badge on Clerk UI.

Before taking real bookings, create a **production** Clerk instance (it needs
the custom domain and DNS records), then:

1. Put the `pk_live_` / `sk_live_` keys in Vercel.
2. Create the JWT template named **`convex`** on the production instance, with
   the role claim:
   ```json
   { "role": "{{user.public_metadata.role}}" }
   ```
3. Point production Convex at the new issuer:
   ```bash
   npx convex env set --prod CLERK_JWT_ISSUER_DOMAIN https://clerk.<your-domain>
   ```
4. Set `{ "role": "owner" }` on your user in the production instance — Clerk
   instances do not share users, so the account must be recreated there.

Skipping step 2 or 3 gives a dashboard that loads but returns "Not authorized"
on every query.

## 5. After the first deploy

- Open `/` and `/services` — services and gallery should render.
- Open `/admin` — should redirect to `/sign-in`.
- Sign in, confirm the dashboard loads and Bookings shows its empty state.
- Submit a test booking on `/book`, then confirm it appears in
  `/admin/bookings` **and** that the email arrives. That exercises both halves
  of the endpoint.

## Notes

**Build depends on Convex.** The four public pages prerender from it, so the
production deployment must be reachable during the build. That is the trade for
static pages with 1-hour ISR instead of a database call on every request.

**Admin edits publish immediately.** Writes call `revalidateTag`, so a service
or gallery change refreshes the public pages without waiting out the hour.

**Seeding a fresh deployment.** See `scripts/seed/README.md`. Production is
already seeded; only a brand-new deployment needs it.

**Node version.** No `engines` field is pinned, so Vercel uses its default
(Node 22 at time of writing). The project builds on Node 20+.
