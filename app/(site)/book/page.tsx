import type { Metadata } from "next";
import { Suspense } from "react";
import { CalendarClock, MessageCircle, ShieldCheck } from "lucide-react";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/motion";
import { BookingForm } from "@/components/booking-form";
import { site, whatsappLink } from "@/lib/site";
import { getPublicServices } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Book Appointment",
  description:
    "Request your appointment at Mabs Studio — choose a service, date, and time, and we'll confirm personally. Open seven days a week by appointment.",
};

const assurances = [
  {
    icon: CalendarClock,
    title: "Seven days a week",
    description: "By appointment only — request the time that suits you, including weekends.",
  },
  {
    icon: MessageCircle,
    title: "Personal confirmation",
    description: "Every request is answered by the studio on WhatsApp or phone before it's fixed.",
  },
  {
    icon: ShieldCheck,
    title: "Your time, protected",
    description: "Appointments never overlap. When you book, the chair is yours alone.",
  },
];

export default async function BookPage() {
  const services = await getPublicServices();

  return (
    <>
      <PageHero
        eyebrow="Book Appointment"
        title="Reserve your time"
        description="Tell us what you'd like done and when. We'll confirm personally — usually within the day."
      />

      <section className="py-20 md:py-28">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <Reveal>
                <h2 className="font-serif text-3xl font-medium leading-tight text-navy md:text-4xl">
                  How booking works
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  Send your request with the form, or skip straight to WhatsApp if you prefer to
                  chat. Either way, nothing is confirmed until we&apos;ve spoken — so there are
                  never double bookings.
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <ul className="mt-10 space-y-8">
                  {assurances.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex gap-5">
                      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper text-royal">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-serif text-lg font-medium text-navy">{title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={0.2}>
                <div className="mt-10 rounded-2xl border border-line bg-paper p-7">
                  <p className="text-sm leading-relaxed text-muted">
                    Prefer to talk it through first?
                  </p>
                  <a
                    href={whatsappLink(
                      "Hello Mabs Studio, I have a question before booking an appointment."
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-royal underline-offset-4 transition-colors hover:underline"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    WhatsApp us on {site.whatsappPhone}
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-line bg-white p-7 shadow-soft md:p-10">
                <Suspense fallback={<p className="text-sm text-muted">Loading booking form…</p>}>
                  <BookingForm services={services} />
                </Suspense>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
