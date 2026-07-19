import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { ImageReveal, Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { StudioImage } from "@/components/studio-image";
import { CtaBanner } from "@/components/cta-banner";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mabs Studio is a premium beauty studio at the University of Cape Coast, founded by Mabre Bernice Ama Morkporkpor — nails, piercings, and wigs by appointment.",
};

const values = [
  {
    title: "Professional service",
    description:
      "Clear communication, punctual appointments, and a standard of work we're happy to put our name on — every single visit.",
  },
  {
    title: "Experienced artist",
    description:
      "Techniques refined across nails, piercings, and wigs, so advice and execution come from real practice, not guesswork.",
  },
  {
    title: "Attention to detail",
    description:
      "Cuticle work, sterile piercing prep, lace customization — the invisible steps are the ones we spend the most time on.",
  },
  {
    title: "Comfortable environment",
    description:
      "One client at a time, in a calm and private space. You'll never feel processed or hurried out of the chair.",
  },
  {
    title: "High-quality products",
    description:
      "We buy professional-grade products and sterile, single-use tools — because results and safety both depend on them.",
  },
  {
    title: "Personalized experience",
    description:
      "Your face shape, lifestyle, and taste lead every decision. The goal is a look that feels like you, only more confident.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="The story behind the studio"
        description={site.tagline}
      />

      <section className="py-20 md:py-28">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <ImageReveal className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-line shadow-soft">
                <StudioImage
                  src="/images/about.jpg"
                  alt="Mabre Bernice Ama Morkporkpor at work in Mabs Studio"
                  fill
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-4 text-xs uppercase tracking-[0.25em] text-muted">
                {site.owner} — Founder &amp; Artist
              </figcaption>
            </ImageReveal>

            <div>
              <Reveal>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">
                  Our Story
                </p>
                <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-navy md:text-5xl">
                  Beauty, taken seriously
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
                  Mabs Studio began with a conviction: that clients at the University of Cape Coast
                  deserved beauty services held to a professional standard — proper products,
                  proper hygiene, proper time. Founder {site.owner} built the studio around that
                  idea, one appointment at a time.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
                  Today the studio offers nails, body piercing, and wigs. The menu
                  has grown; the approach hasn&apos;t. Every client is met personally, consulted
                  honestly, and sent home with work that holds up in daylight.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
                  We keep the studio appointment-only, seven days a week, because good work needs
                  room to breathe — and because you deserve an artist whose attention isn&apos;t
                  split.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <Link
                  href="/book"
                  className="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-navy px-8 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-royal"
                >
                  Book Your Visit
                </Link>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-veil py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <Reveal>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">
                What We Stand For
              </p>
              <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-navy md:text-5xl">
                Six promises, kept every visit
              </h2>
            </Reveal>
          </div>
          <RevealGroup className="mt-16 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <RevealItem key={value.title}>
                <div className="border-t border-line pt-6">
                  <span className="font-serif text-sm tracking-[0.2em] text-royal">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-serif text-xl font-medium text-navy">{value.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{value.description}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
