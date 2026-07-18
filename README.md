# Mabs Studio — Premium Beauty Studio Website

Editorial, luxury-magazine-inspired website for **Mabs Studio** (University of Cape Coast).
Built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, React Hook Form, and Zod.

## Getting started

```bash
npm install
npm run dev      # develop at http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Where to edit things

| What | Where |
| --- | --- |
| Business info (phone, email, hours, socials) | [`lib/site.ts`](lib/site.ts) |
| Services, prices, durations | [`lib/services.ts`](lib/services.ts) |
| Gallery photos & captions | [`lib/gallery.ts`](lib/gallery.ts) + `public/images/` |
| Design tokens (colors, fonts, shadows) | [`app/globals.css`](app/globals.css) |
| SEO metadata & LocalBusiness schema | [`app/layout.tsx`](app/layout.tsx) |

### Swapping in real photography

The images in `public/images/` are **art-direction placeholders** (flat-tone editorial SVGs).
Replace them with real photos (JPG/WebP, same file names or update the paths in
`lib/services.ts` / `lib/gallery.ts`). Keep the listed width/height in `lib/gallery.ts`
in sync with each photo so the masonry grid reserves space before loading.

### Social links

Instagram / TikTok / Facebook icons are hidden until you add URLs in `lib/site.ts`
(`site.social`). Add a link and the icon appears everywhere automatically.

### Booking flow

The booking form validates with Zod, then hands the confirmed request to the studio via a
prefilled **WhatsApp message** (no backend required). To wire it to email or a database
instead, replace the submit handler in
[`components/booking-form.tsx`](components/booking-form.tsx).

### Going live

1. Set the production domain in `lib/site.ts` (`site.url`) — it drives Open Graph, the
   sitemap, and robots.txt.
2. Replace the map placeholder in [`app/contact/page.tsx`](app/contact/page.tsx) with a
   Google Maps embed once the studio pin is final.
3. Deploy to Vercel (zero config) or any Node host.
