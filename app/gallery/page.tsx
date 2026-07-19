import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/motion";
import { GalleryGrid } from "@/components/gallery-grid";
import { CtaBanner } from "@/components/cta-banner";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Browse recent nails, lashes, piercings, and wig work from Mabs Studio — captured as it left the chair.",
};

export default function GalleryPage() {
  return (
    <>
      <PageHero
        eyebrow="The Gallery"
        title="Work that speaks quietly"
        description="A selection of recent sets, styles, installs, and piercings. Filter by service to find the look you have in mind."
      />
      <section className="py-20 md:py-28">
        <Container>
          <Reveal>
            <GalleryGrid />
          </Reveal>
        </Container>
      </section>
      <CtaBanner />
    </>
  );
}
