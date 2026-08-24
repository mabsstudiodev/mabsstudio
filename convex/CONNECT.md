# Convex — connected

The deployment is live and the admin runs against it.

- Deployment: **`dev/mabsstudiodev`** (`beloved-ferret-652`)
- `CLERK_JWT_ISSUER_DOMAIN` is set on the deployment
- Schema and functions are pushed; `convex/_generated/` exists
- Seeded: **4 services**, **34 gallery items** (imported from the live site files)

## Remaining setup on your side

**1. The Clerk JWT template.** Convex reads the admin role from a custom claim.
In Clerk: **Configure → JWT Templates**, template named exactly **`convex`**,
with this claim:

```json
{ "role": "{{user.public_metadata.role}}" }
```

**2. Your role.** Clerk → **Users → your account → Metadata → Public**:

```json
{ "role": "owner" }
```

Sign out and back in afterwards so a fresh JWT carries the claim.

Without both, every Convex call fails with "Not authorized" — including yours.
That is the guard working, not a bug.

---

## How the pieces fit

```
Server Component  ──►  lib/admin/*.ts        ──►  fetchQuery  ──►  Convex
   (reads)                (server-only)              + Clerk JWT

Client Component  ──►  lib/admin/actions.ts  ──►  fetchMutation ──►  Convex
   (writes)               ("use server")           + Clerk JWT
```

There is no `ConvexProvider` and no Convex client in the browser. Reads happen
in Server Components; writes go through Server Actions. The components call
plain async functions and never see a token, which keeps every credential
server-side.

The one exception is a gallery upload: the browser POSTs the file straight to a
Convex Storage URL so the bytes skip the Next.js server entirely. Only the
resulting storage id round-trips through a Server Action.

After each write the action calls `revalidatePath` for the affected pages.

### Authorization

Every query and mutation touching customer data calls `requireManager` (or
`requireOwner` for settings and content) from `convex/lib/auth.ts` **first**.
The Next.js route guard is convenience only — anyone holding a token can call a
Convex function directly, so the real check lives in Convex.

`bookings.create` is deliberately unauthenticated so the public form can call
it. It accepts no status field and always writes `pending`.

### Single-row tables

`siteContent` and `businessSettings` hold no row until the owner saves once.
`get` returns `null` and the Next.js layer falls back to `fallbackContent` /
`fallbackSettings`, which mirror the copy in the page components and
`lib/site.ts`. No seed step, no defaults duplicated in two places.

---

## The public site reads from Convex

`/`, `/services`, `/gallery`, and `/book` render from `api.services.listActive`
and `api.gallery.listActive` via `lib/public-data.ts`. The old hardcoded arrays
in `lib/services.ts` and `lib/gallery.ts` are gone; those files now hold only
the display types.

Reads go through `unstable_cache`, so all four pages still prerender as static
with a one-hour ISR backstop — the public site does not hit Convex per request,
and a brief Convex outage serves the cached page. Admin writes call
`revalidateTag(PUBLIC_TAGS.services | .gallery)`, so an edit publishes at once
rather than waiting for the hour.

One consequence worth knowing: `next build` now needs `NEXT_PUBLIC_CONVEX_URL`
and a reachable deployment, because those pages are prerendered at build time.

### Still file-backed

Hero and about copy, contact details, hours, and social links are editable in
the admin but the public pages do not read them yet — `/` still renders its
own headline and `lib/site.ts` still drives the footer and contact page.

The hero headline is the awkward one: it renders as
`Beauty Crafted <em>Around You</em>`, and the CMS stores one flat string, so
wiring it naively would drop the italic accent. Worth deciding how you want
that handled before I change it.

## Reference

| File | Functions |
| --- | --- |
| `schema.ts` | 7 tables with indexes. No `users` table — roles live in Clerk. |
| `lib/auth.ts` | `requireManager` / `requireOwner` / `recordActivity` |
| `auth.config.ts` | Trusts JWTs from your Clerk instance |
| `bookings.ts` | list, getById, listToday, listUpcoming, stats, create, updateStatus, remove |
| `services.ts` | listActive, list, getById, getBySlug, create, update, remove, toggleActive, duplicate, reorder |
| `gallery.ts` | listActive, list, getById, generateUploadUrl, create, update, remove, toggleActive, reorder |
| `testimonials.ts` | listPublished, list, getById, create, update, remove, setStatus, setFeatured |
| `siteContent.ts` | get, save |
| `businessSettings.ts` | get, getBookingRules, save |
| `activity.ts` | list |

Deletes clean up storage: removing a booking or gallery item also deletes its
blobs, so private customer photos never outlive the record.
