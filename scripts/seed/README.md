# Seed data

The studio's real services and gallery, exported from the site files they
originally lived in. The dev deployment has already been seeded; a **new**
deployment (production) starts empty, and the public pages render from Convex —
so without this the live site would launch with no services and no gallery.

```bash
# Against production
npx convex import --prod --table services --format jsonLines --append scripts/seed/services.jsonl
npx convex import --prod --table gallery  --format jsonLines --append scripts/seed/gallery.jsonl
```

Drop `--prod` to target dev. `--append` is used rather than `--replace` so an
import can never wipe records the studio has since added.

These live outside `convex/` on purpose: Convex bundles every file in that
folder for its runtime, and a CommonJS Node script there fails the deploy.

`generate.cjs` regenerated these files from `lib/services.ts` and
`lib/gallery.ts` back when those held the data. Both files now hold only types,
so the script is kept for provenance — Convex is the source of truth.

Gallery rows reference `/images/...` paths served from `public/`, not Convex
Storage, so the existing photos and clips keep working without re-uploading.
New uploads through the admin go to Convex Storage.
