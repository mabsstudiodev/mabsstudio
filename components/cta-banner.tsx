import Link from "next/link";
import { Container } from "@/components/container";
import { Reveal } from "@/components/motion";
import { site, whatsappLink } from "@/lib/site";

export function CtaBanner() {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <Reveal>
          <div className="grain relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-royal px-8 py-16 text-center shadow-soft md:px-16 md:py-20">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-24 size-80 rounded-full bg-blush/20 blur-3xl" />
              <div className="absolute -bottom-28 -left-16 size-72 rounded-full bg-white/10 blur-3xl" />
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/60">
              {site.tagline}
            </p>
            <h2 className="mx-auto mt-5 max-w-2xl font-serif text-4xl font-medium leading-[1.1] text-white md:text-5xl">
              Your next appointment is a conversation away
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70">
              Tell us the look you have in mind and we&apos;ll reserve the time to get it right —
              seven days a week, by appointment.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/book"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-8 text-sm font-medium tracking-wide text-navy transition-colors duration-300 hover:bg-paper"
              >
                Book Appointment
              </Link>
              <a
                href={whatsappLink("Hello Mabs Studio, I would like to book an appointment.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-8 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:border-white hover:bg-white hover:text-navy"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
