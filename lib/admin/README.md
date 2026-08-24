# Admin data layer

Everything the admin UI reads or writes goes through this folder. Components
never import a Convex client and never handle a token.

```
Server Component  ──►  bookings.ts / services.ts / …   ──►  Convex  (reads)
                          server-only, authed

Client Component  ──►  actions.ts                      ──►  Convex  (writes)
                          "use server", authed
```

## Files

| File | Role |
| --- | --- |
| `convex-server.ts` | `query` / `mutation` carry the Clerk JWT; `publicQuery` / `publicMutation` deliberately don't |
| `actions.ts` | Every write, as Server Actions. Calls `revalidatePath` afterwards |
| `bookings.ts` `services.ts` `gallery.ts` `testimonials.ts` `content.ts` `settings.ts` `activity.ts` | Server-only reads. Marked `server-only`, so importing one from a client component is a build error |
| `auth.ts` | Clerk role for the route guard in `app/admin/layout.tsx` |
| `booking-utils.ts` | Pure: date helpers, in-memory filtering, CSV. Client-safe |
| `catalog.ts` | Pure: category labels, price formatting, slugify. Client-safe |
| `gallery-upload.ts` | Browser-side: measures the file, POSTs it to Convex Storage, records the id |
| `schemas.ts` | Zod schemas for the forms |
| `format.ts` | Date, time, and phone display helpers |
| `data-source.ts` | Turns a thrown Convex error into a sentence an admin should read |

## Why writes are Server Actions rather than `useQuery` / `useMutation`

The client never holds a Convex client, so no token reaches the browser and
authorization is unavoidably server-side. Components call
`await updateBookingStatus(id, status)` like any async function.

The trade-off is no live reactivity — a change shows after `revalidatePath`
rather than pushing to other open tabs. For a single-operator studio dashboard
that is the right call. To change it later, add `ConvexProviderWithClerk` and
swap a view's prop for `useQuery`; each view takes its data as a single prop
specifically so that stays a local change.

## Conventions worth keeping

**Reads are `server-only`.** If you need a value in a client component, put it
in `booking-utils.ts` or `catalog.ts` instead of exporting it from a read
module — otherwise the server bundle leaks into the browser build.

**Re-validate in Convex.** `schemas.ts` runs in the browser for the person
filling the form. The Convex function is what protects the data.

**Fallbacks are intentional.** `content.ts` and `settings.ts` export
`fallbackContent` / `fallbackSettings` used when the single-row Convex tables
are still empty. They mirror what the page components and `lib/site.ts` already
say, so the site is correct before the first save.

See [`convex/CONNECT.md`](../../convex/CONNECT.md) for the backend side.
