import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion";
import { SocialLinks, hasSocialLinks } from "@/components/social-links";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Mabs Studio by phone, WhatsApp, or email. Located at the University of Cape Coast — open seven days a week by appointment.",
};

const contactCards = [
  {
    icon: Phone,
    title: "Phone",
    detail: site.phone,
    href: `tel:${site.phoneIntl}`,
    action: "Call the studio",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    detail: site.phone,
    href: whatsappLink("Hello Mabs Studio, I would like to make an enquiry."),
    action: "Start a chat",
    external: true,
  },
  {
    icon: Mail,
    title: "Email",
    detail: site.email,
    href: `mailto:${site.email}`,
    action: "Write to us",
  },
  {
    icon: Clock,
    title: "Business Hours",
    detail: "Monday – Sunday",
    sub: "Appointments only",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We're easy to reach"
        description="Questions, enquiries, or a look you want to talk through — message the studio and we'll reply personally."
      />

      <section className="py-20 md:py-28">
        <Container>
          <RevealGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {contactCards.map(({ icon: Icon, title, detail, sub, href, action, external }) => (
              <RevealItem key={title} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-7 shadow-soft">
                  <span className="inline-flex size-11 items-center justify-center rounded-xl bg-paper text-royal">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 font-serif text-xl font-medium text-navy">{title}</h2>
                  <p className="mt-2 text-sm text-ink">{detail}</p>
                  {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
                  {href && (
                    <a
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="mt-auto pt-5 text-sm font-medium text-royal underline-offset-4 transition-colors hover:underline"
                    >
                      {action}
                    </a>
                  )}
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-paper p-8 md:p-10">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">
                  Location
                </p>
                <h2 className="mt-4 font-serif text-3xl font-medium leading-tight text-navy">
                  University of Cape Coast
                </h2>
                <p className="mt-4 flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                  <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  Cape Coast, Central Region, Ghana. Exact directions are shared when your
                  appointment is confirmed.
                </p>
                {hasSocialLinks() && (
                  <div className="mt-8">
                    <p className="text-xs font-medium uppercase tracking-[0.25em] text-navy">
                      Follow the studio
                    </p>
                    <SocialLinks className="mt-4" />
                  </div>
                )}
                <div className="mt-auto pt-8">
                  <Link
                    href="/book"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-navy px-8 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-royal"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="h-full overflow-hidden rounded-3xl border border-line shadow-soft">
                <iframe
                  title="Map of the University of Cape Coast"
                  src="https://www.google.com/maps?q=University+of+Cape+Coast,+Cape+Coast,+Ghana&z=15&output=embed"
                  className="aspect-[4/3] h-full w-full border-0 lg:aspect-auto"
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
