/**
 * Generates Convex import files from the data that currently drives the
 * public site, so the migration carries the real services and gallery rather
 * than anything invented.
 */
const fs = require("fs");
const path = require("path");

const OUT = __dirname;

/** Extracts the array literal assigned after `marker` and evaluates it. */
function arrayAfter(file, marker) {
  const src = fs.readFileSync(file, "utf8");
  const at = src.indexOf(marker);
  if (at < 0) throw new Error(`marker not found: ${marker}`);

  // Skip the `[` in a type annotation like `Service[] = [` by anchoring on `= [`.
  const assign = src.indexOf("= [", at);
  if (assign < 0) throw new Error(`no array assignment after ${marker}`);
  const start = src.indexOf("[", assign);

  let depth = 0;
  let inStr = null;
  for (let p = start; p < src.length; p++) {
    const c = src[p];
    if (inStr) {
      if (c === inStr && src[p - 1] !== "\\") inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return eval(`(${src.slice(start, p + 1)})`);
    }
  }
  throw new Error("unbalanced array literal");
}

const CATEGORY_BY_SLUG = {
  "professional-nails": "nails",
  "lash-extensions": "lashes",
  "body-piercing": "piercing",
  "wig-installations": "wigs",
};

const services = arrayAfter("lib/services.ts", "export const services").map((s, i) => {
  const amount = String(s.price).replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  const row = {
    slug: s.slug,
    title: s.title,
    description: s.description,
    startingPrice: amount ? Number(amount[1]) : null,
    currency: "GHS",
    duration: s.duration,
    category: CATEGORY_BY_SLUG[s.slug] ?? "other",
    image: s.image,
    featured: Boolean(s.featured),
    active: true,
    sortOrder: i,
  };
  if (s.video) row.video = s.video;
  return row;
});

const gallery = arrayAfter("lib/gallery.ts", "export const galleryItems").map((g, i) => {
  const row = {
    src: g.src,
    alt: g.alt,
    category: g.category,
    type: g.video ? "video" : "image",
    width: g.width,
    height: g.height,
    featured: false,
    active: true,
    sortOrder: i,
  };
  if (g.poster) row.poster = g.poster;
  return row;
});

for (const [name, rows] of [
  ["services", services],
  ["gallery", gallery],
]) {
  if (rows.length === 0) throw new Error(`${name}: parsed 0 rows`);
  const file = path.join(OUT, `${name}.jsonl`);
  fs.writeFileSync(file, rows.map((r) => JSON.stringify(r)).join("\n") + "\n", "utf8");
  console.log(`${name}: ${rows.length} rows -> ${file}`);
}

console.log("\nservice[0]:", JSON.stringify(services[0]).slice(0, 160));
console.log("gallery[0]:", JSON.stringify(gallery[0]));
console.log(
  "videos:",
  gallery.filter((g) => g.type === "video").length,
  "| posters:",
  gallery.filter((g) => g.poster).length
);
console.log("categories:", [...new Set(gallery.map((g) => g.category))].join(", "));
