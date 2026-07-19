import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { RevealGroup, RevealItem } from "@/components/motion";
import { ServiceCard } from "@/components/service-card";
import { CtaBanner } from "@/components/cta-banner";
import { services } from "@/lib/services";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Professional nails, body piercing, and wigs — by appointment at Mabs Studio, University of Cape Coast.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Services"
        title="A focused menu, done properly"
        description="Every service below is performed by appointment, with a short consultation first. Prices are starting points — the final quote depends on length, design, and finish."
      />
      <section className="py-20 md:py-28">
        <Container>
          <RevealGroup className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service, i) => (
              <RevealItem key={service.slug} className="h-full">
                <ServiceCard service={service} index={i} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>
      <CtaBanner />
    </>
  );
}
