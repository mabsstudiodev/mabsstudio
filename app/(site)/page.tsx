import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Gem,
  HeartHandshake,
  Home as HomeIcon,
  Sparkle,
  UserCheck,
  Wand2,
} from "lucide-react";
import { Container } from "@/components/container";
import { SectionHeader } from "@/components/section-header";
import { ImageReveal, Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { ServiceCard } from "@/components/service-card";
import { FeatureCard } from "@/components/feature-card";
import { Faq } from "@/components/faq";
import { CtaBanner } from "@/components/cta-banner";
import { HeroCarousel, type HeroSlide } from "@/components/hero-carousel";
import { StudioImage } from "@/components/studio-image";
import { getPublicGallery, getPublicServices } from "@/lib/public-data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: `${site.name} — Beauty Crafted Around You`,
  description:
    "Premium nails, lash extensions, piercings, and wig installations at the University of Cape Coast. Every visit by appointment, every detail considered.",
};

const heroSlides: HeroSlide[] = [
  { src: "/images/hero.jpg", alt: "The artist behind Mabs Studio", label: "Mabre Bernice Ama" },
  { src: "/images/gallery-nails-1.jpg", alt: "Signature nail set from Mabs Studio", label: "Nails" },
  { src: "/images/gallery-wigs-1.jpg", alt: "Custom wig unit, soft curls", label: "Wigs" },
  { src: "/images/gallery-piercing-1.jpg", alt: "Curated ear stack with gold studs", label: "Piercing" },
];

const features = [
  {
    icon: UserCheck,
    title: "Experienced Artist",
    description:
      "Every service is performed by a trained artist who treats each set, style, and piercing as considered work — not a rushed slot.",
  },
  {
    icon: Sparkle,
    title: "Attention to Detail",
    description:
      "Clean lines, even finishes, and symmetry you can see up close. We work slowly where it matters so the result lasts.",
  },
  {
    icon: HomeIcon,
    title: "Comfortable Environment",
    description:
      "A calm, private studio where appointments never overlap. Your time is yours from the moment you sit down.",
  },
  {
    icon: Gem,
    title: "High-Quality Products",
    description:
      "Professional-grade gels, adhesives, hair, and sterile piercing jewelry — chosen for safety and staying power.",
  },
  {
    icon: Wand2,
    title: "Personalized Experience",
    description:
      "We start every appointment with a short consultation, then tailor shape, length, and finish to you.",
  },
  {
    icon: HeartHandshake,
    title: "Honest Guidance",
    description:
      "If a style won't suit your lifestyle or hair, we'll say so — and recommend what will. Confidence is the goal.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Request your time",
    description:
      "Send a booking request through the website or WhatsApp with your preferred service, date, and time.",
  },
  {
    step: "02",
    title: "We confirm personally",
    description:
      "The studio replies to confirm availability, answer questions, and note any inspiration photos you share.",
  },
  {
    step: "03",
    title: "Your appointment",
    description:
      "Arrive to a prepared station and a short consultation, then relax while the work is done properly.",
  },
  {
    step: "04",
    title: "Aftercare guidance",
    description:
      "Leave with simple care instructions so your nails, piercing, or install stay flawless for longer.",
  },
];

const faqItems = [
  {
    question: "How do I book an appointment?",
    answer:
      "Use the booking page to send a request with your preferred service, date, and time, or message us directly on WhatsApp at 0501861906. We confirm every appointment personally before it is fixed.",
  },
  {
    question: "Do you accept walk-ins?",
    answer:
      "The studio works by appointment only, seven days a week. This keeps every session unhurried and guarantees the artist's full attention — so please book ahead, even for same-day visits.",
  },
  {
    question: "Where is the studio located?",
    answer:
      "We are located at the University of Cape Coast. The exact directions are shared when your appointment is confirmed, so you arrive without any guesswork.",
  },
  {
    question: "Can I bring a photo of the style I want?",
    answer:
      "Please do — inspiration photos are the best starting point. You can attach one to your booking request or send it on WhatsApp, and we'll advise on how to adapt it to suit you.",
  },
  {
    question: "How long do services take?",
    answer:
      "Most nail appointments take 60 to 120 minutes, lash sets 90 to 120 minutes, piercings around 30 minutes, and installs 60 to 90 minutes. Custom wigs are made to order, and we'll give you a clear timeline when you book.",
  },
  {
    question: "How should I prepare for my appointment?",
    answer:
      "Come with clean, product-free nails for nail services, makeup-free lashes for lash appointments, and freshly washed hair for wig installs. If anything specific is needed, we'll let you know when we confirm.",
  },
];

export default async function HomePage() {
  const [services, gallery] = await Promise.all([
    getPublicServices(),
    getPublicGallery(),
  ]);

  // Fall back to the first few services if nothing is flagged featured, so the
  // homepage grid is never empty just because the flag was cleared.
  const flagged = services.filter((s) => s.featured);
  const featured = flagged.length > 0 ? flagged : services.slice(0, 3);
  const preview = gallery.slice(0, 4);

  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden bg-veil">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="animate-drift absolute -right-16 top-24 size-[24rem] rounded-full bg-royal/[0.07] blur-3xl" />
          <div className="animate-drift-slow absolute -left-16 bottom-32 size-[22rem] rounded-full bg-blush/[0.12] blur-3xl" />
          <div className="animate-drift absolute left-[calc(50%-9rem)] top-1/3 size-72 rounded-full bg-blush/10 blur-3xl" />
        </div>
        <Container>
          <div className="grid items-center gap-12 pb-20 pt-32 md:pb-28 md:pt-40 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <div className="max-w-xl">
              <Reveal>
                <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-royal">
                  Mabs Studio
                  <span
                    aria-hidden="true"
                    className="h-px w-8 bg-gradient-to-l from-transparent to-blush/70"
                  />
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 className="mt-6 font-serif text-5xl font-medium leading-[1.05] text-navy sm:text-6xl lg:text-7xl">
                  Beauty Crafted <em className="italic text-royal">Around You</em>
                </h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="mt-7 max-w-md text-base leading-relaxed text-muted md:text-lg">
                  Nails, lashes, wigs, and piercings — by appointment.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link
                    href="/book"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-navy px-9 text-base font-medium tracking-wide text-white transition-colors duration-300 hover:bg-royal"
                  >
                    Book Appointment
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-navy/25 px-9 text-base font-medium tracking-wide text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white"
                  >
                    Explore Services
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </Reveal>
            </div>

            <Reveal
              as="figure"
              delay={0.15}
              className="relative order-first mx-auto w-full max-w-md lg:order-none lg:max-w-none"
            >
              <HeroCarousel slides={heroSlides} />
              <figcaption className="mt-5 hidden items-baseline justify-between text-xs uppercase tracking-[0.25em] text-muted lg:flex">
                <span>Mabs Studio</span>
                <span>University of Cape Coast</span>
              </figcaption>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Services marquee */}
      <div aria-hidden="true" className="overflow-hidden border-y border-line bg-white py-4">
        <div className="animate-marquee flex w-max items-center">
          {[0, 1].map((half) => (
            <div key={half} className="flex items-center">
              {[
                "Professional Nails",
                "Lash Extensions",
                "Wig Installations",
                "Body Piercing",
                "By Appointment Only",
              ].map((item) => (
                <span
                  key={item}
                  className="flex items-center whitespace-nowrap font-serif text-lg italic text-navy/60"
                >
                  <span className="px-6">{item}</span>
                  <span className="text-sm not-italic text-blush/70">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Featured services */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeader
            eyebrow="Signature Services"
            title="The work we're known for"
            description="A focused menu of beauty services, each done properly. Explore the full menu or start with a studio favourite."
          />
          <RevealGroup className="mt-16 grid gap-8 md:grid-cols-3">
            {featured.map((service) => (
              <RevealItem key={service.slug} className="h-full">
                <ServiceCard service={service} index={services.indexOf(service)} />
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-12 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-royal underline-offset-4 transition-colors hover:underline"
            >
              View all services
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* About */}
      <section className="bg-veil py-24 md:py-32">
        <Container>
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <ImageReveal className="relative order-last mx-auto w-full max-w-md lg:order-first lg:max-w-none">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-line shadow-soft">
                <StudioImage
                  src="/images/about.jpg"
                  alt="Inside the Mabs Studio space"
                  fill
                  sizes="(max-width: 1024px) 90vw, 45vw"
                  className="object-cover"
                />
              </div>
            </ImageReveal>
            <div>
              <Reveal>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">
                  About Mabs Studio
                </p>
                <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-navy md:text-5xl">
                  A studio built on craft, not shortcuts
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
                  Mabs Studio was founded by {site.owner} with a simple belief: beauty services
                  should be done carefully, personally, and to a standard you can feel. From your
                  first message to your aftercare, every step is handled by the artist herself.
                </p>
                <p className="mt-4 text-base leading-relaxed text-muted md:text-lg">
                  Based at the University of Cape Coast, the studio serves clients seven days a
                  week — always by appointment, so no visit ever feels rushed or crowded.
                </p>
              </Reveal>
              <Reveal delay={0.2}>
                <ul className="mt-8 grid gap-x-8 gap-y-3 text-sm text-ink sm:grid-cols-2">
                  {[
                    "Professional service",
                    "Experienced artist",
                    "Attention to detail",
                    "Comfortable environment",
                    "High-quality products",
                    "Personalized experience",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span className="size-1.5 rounded-full bg-royal" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.3}>
                <Link
                  href="/about"
                  className="mt-10 inline-flex h-12 items-center justify-center rounded-xl border border-navy/25 px-7 text-sm font-medium tracking-wide text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white"
                >
                  Our Story
                </Link>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* Why choose us */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeader
            eyebrow="Why Choose Us"
            title="Considered in every detail"
            description="The difference between a service and an experience is in the small decisions. Here is what we never compromise on."
          />
          <RevealGroup className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <RevealItem key={f.title} className="h-full">
                <FeatureCard {...f} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* Gallery preview */}
      <section className="bg-veil py-24 md:py-32">
        <Container>
          <SectionHeader
            eyebrow="The Gallery"
            title="Recent work from the studio"
            description="Sets, styles, installs, and piercings — photographed as they left the chair."
          />
          <RevealGroup className="mt-16 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {preview.map((item) => (
              <RevealItem key={item.src}>
                <div className="overflow-hidden rounded-3xl border border-line shadow-soft">
                  {item.video ? (
                    <video
                      src={item.src}
                      poster={item.poster}
                      width={item.width}
                      height={item.height}
                      muted
                      loop
                      autoPlay
                      playsInline
                      aria-label={item.alt}
                      className="aspect-square h-auto w-full object-cover"
                    />
                  ) : (
                    <StudioImage
                      src={item.src}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="aspect-square h-auto w-full object-cover"
                    />
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
          <Reveal className="mt-12 text-center">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-royal underline-offset-4 transition-colors hover:underline"
            >
              Browse the full gallery
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* Appointment process */}
      <section className="py-24 md:py-32">
        <Container>
          <SectionHeader
            eyebrow="How It Works"
            title="From request to results"
            description="Booking with Mabs Studio is deliberately simple — four steps from your first message to your finished look."
          />
          <RevealGroup className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4" stagger={0.12}>
            {processSteps.map((step) => (
              <RevealItem key={step.step}>
                <div className="border-t border-line pt-6">
                  <span className="font-serif text-3xl font-medium text-royal">{step.step}</span>
                  <h3 className="mt-4 font-serif text-xl font-medium text-navy">{step.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{step.description}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-veil py-24 md:py-32">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <SectionHeader
                align="left"
                eyebrow="Questions"
                title="Before you book"
                description="The answers most clients ask for. Anything else — send us a message and we'll reply personally."
              />
              <Reveal delay={0.15}>
                <Link
                  href="/contact"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-medium tracking-wide text-royal underline-offset-4 transition-colors hover:underline"
                >
                  Ask us anything
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <Faq items={faqItems} />
            </Reveal>
          </div>
        </Container>
      </section>

      <CtaBanner />
    </>
  );
}
