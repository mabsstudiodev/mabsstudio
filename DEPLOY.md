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
unset CONVEX_DEPLOYMENT && npx convex deploy --cmd 'npm run build'
```

Two things are going on.

`npx convex deploy --cmd` is required because the public pages prerender from
Convex (`lib/public-data.ts`). It supplies `NEXT_PUBLIC_CONVEX_URL` to the
build; a bare `npm run build` dies prerendering `/services`.

`unset CONVEX_DEPLOYMENT` is defensive. The Convex CLI picks its target in this
order:

1. `CONVEX_DEPLOYMENT` if set — the local-development path, which needs a
   logged-in user token that CI does not have.
2. `CONVEX_DEPLOY_KEY` — the CI path.

So a `CONVEX_DEPLOYMENT` copied into Vercel alongside the other variables wins
over the deploy key and fails with `MissingAccessToken`. Unsetting it in the
build command means the deploy key always decides.

`vercel.json` also takes precedence over any command set in the dashboard, so
the two cannot drift.

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
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://mabsstudiogh.com` | Drives Open Graph, sitemap, robots. Falls back to Vercel's production URL, then `mabsstudiogh.com`. |

`.env.local` is gitignored, so none of these reach the repo — they must be
entered in Vercel.

### Do not copy these two from `.env.local`

| Variable | Why not |
| --- | --- |
| `CONVEX_DEPLOYMENT` | Local-development pointer at the **dev** deployment. In CI it overrides the deploy key and fails the build. The build command unsets it, but it should not be there at all. |
| `NEXT_PUBLIC_CONVEX_URL` | Supplied by `convex deploy --cmd`. A hand-set value risks pointing the live site at the dev database. |

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
- Open the booking and press **Confirm booking**. The customer's address (use
  your own for the test) should receive a "Your appointment is confirmed"
  email. It is sent once, only when the status changes to confirmed, from the
  same Gmail account, with replies going to the studio's contact email in
  Settings. If the deposit is still unpaid, the email includes a payment link.

## 6. Admin subdomain (`admin.mabsstudiogh.com`)

The dashboard can be served from its own subdomain. It is off until
`NEXT_PUBLIC_ADMIN_HOST` is set, so the order matters:

1. Vercel → Settings → Domains → add `admin.mabsstudiogh.com`.
2. Add the DNS record Vercel shows (a CNAME named `admin`) at Hostinger, and
   wait for Vercel to mark the domain valid.
3. Add `NEXT_PUBLIC_ADMIN_HOST` = `admin.mabsstudiogh.com` to **Production**
   only, then redeploy (it is inlined at build time).

Once it is on, `mabsstudiogh.com/admin/...` and `/sign-in` redirect to the
subdomain, where `/bookings` renders the `/admin/bookings` route
(`middleware.ts`). Setting the variable before DNS resolves would send the
dashboard to a dead host — removing it and redeploying turns it back off.
Previews and local dev keep `/admin`. Clerk needs no change: a production
instance covers subdomains of its domain.

To try it locally, build with `NEXT_PUBLIC_ADMIN_HOST=admin.localhost` and
open `http://admin.localhost:3000`.

## 7. Booking deposits (Paystack)

Deposits are off until the owner turns them on in **Settings → Deposits**, and
Convex refuses to turn them on until Paystack is connected. Connecting it is
three steps. The secret key goes on **Convex**, not Vercel: Paystack is only
ever called from `convex/payments.ts`.

**1. Keys.** Paystack dashboard → Settings → API Keys & Webhooks. Each Convex
deployment gets its own key, so dev runs in test mode and production runs live:

```bash
# dev deployment, for local work. Test key, so no real money moves
npx convex env set PAYSTACK_SECRET_KEY sk_test_...
npx convex env set SITE_URL http://localhost:3000

# production
npx convex env set --prod PAYSTACK_SECRET_KEY sk_live_...
npx convex env set --prod SITE_URL https://www.mabsstudiogh.com
```

`SITE_URL` is where Paystack returns the customer after paying
(`/book/payment/<booking id>`). It is read from the environment, never from
the request, so nobody can start a checkout in the studio's name that
returns somewhere else.

**2. Webhook.** Same Paystack page, set the **live** webhook URL to
`https://www.mabsstudiogh.com/api/paystack/webhook` — with `www`, because the
bare domain answers with a redirect, which Paystack does not follow. It confirms payments for
customers who close the tab before Paystack redirects them back. Test mode
cannot reach `localhost`, so locally the return page does all the confirming,
which is enough to test the whole flow.

**3. Turn it on.** Settings → Deposits: tick *Require a deposit to book*, set
the default amount and the policy text, and save. A service can override the
amount, or opt out with `0`, under Services → edit → *Deposit*.

The same screen sets a **transaction fee**, a percentage of the deposit added
on top to cover Paystack's charges. It defaults to **2%**, so a GH₵50
deposit charges the customer GH₵51. Set it to `0` to absorb the fee. Like the
deposit, the fee is fixed on each booking when it is made, so changing it
later doesn't alter what existing bookings owe.

What happens next:

- The booking form shows the deposit for the chosen service, and submitting
  sends the customer to Paystack's checkout (mobile money or card).
- The booking is recorded at once as **Deposit unpaid**. The studio email is
  sent only after payment, so the inbox gets no abandoned checkouts.
- The amount is fixed inside Convex when the booking is made, and a payment
  counts only if Paystack confirms the same booking id and the full amount.
- Paying the deposit doesn't confirm the appointment. The studio still
  confirms each booking, because nothing stops two customers paying for the
  same slot.
- A booking's Deposit card lets the studio copy or WhatsApp the payment link,
  re-check Paystack, mark a deposit paid by hand, waive it, or record a
  refund. Refunds themselves are issued in the Paystack dashboard.

To test, use Paystack's test cards or test mobile money numbers against the
dev deployment, and check that the booking shows **Deposit paid** and that the
email arrives.

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
