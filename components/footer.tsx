import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { Container } from "@/components/container";
import { SocialLinks } from "@/components/social-links";

const quickLinks = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book Appointment" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-veil">
      <Container>
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-20">
          <div className="max-w-xs">
            <p className="font-serif text-2xl font-semibold text-navy">
              Mabs<span className="text-royal"> Studio</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{site.tagline}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Nails, lashes, piercings, and wig installations — by appointment at the
              University of Cape Coast.
            </p>
            <SocialLinks className="mt-6" />
          </div>

          <nav aria-label="Footer">
            <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-navy">
              Quick Links
            </h2>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors duration-300 hover:text-royal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-navy">
              Working Hours
            </h2>
            <ul className="mt-5 space-y-3 text-sm text-muted">
              <li>Monday – Sunday</li>
              <li>By appointment only</li>
              <li className="pt-2 text-ink">
                Reserve your session in advance — every appointment is dedicated time.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-medium uppercase tracking-[0.25em] text-navy">Contact</h2>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${site.phoneIntl}`}
                  className="inline-flex items-center gap-2.5 text-muted transition-colors duration-300 hover:text-royal"
                >
                  <Phone className="size-4 shrink-0" aria-hidden="true" />
                  {site.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="inline-flex items-center gap-2.5 text-muted transition-colors duration-300 hover:text-royal"
                >
                  <Mail className="size-4 shrink-0" aria-hidden="true" />
                  {site.email}
                </a>
              </li>
              <li className="inline-flex items-start gap-2.5 text-muted">
                <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                University of Cape Coast
              </li>
              <li className="pt-1">
                <a
                  href={whatsappLink("Hello Mabs Studio, I would like to book an appointment.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-royal underline-offset-4 transition-colors hover:underline"
                >
                  Message us on WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-line py-8 text-sm text-muted md:flex-row">
          <p>
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <Link
            href="/privacy"
            className="transition-colors duration-300 hover:text-royal"
          >
            Privacy Policy
          </Link>
        </div>
      </Container>
    </footer>
  );
}
