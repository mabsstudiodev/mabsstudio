import type { Metadata } from "next";
import { Container } from "@/components/container";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/motion";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Mabs Studio collects, uses, and protects the personal information you share when booking or contacting the studio.",
};

const sections = [
  {
    title: "Information we collect",
    body: [
      "When you request an appointment or contact the studio, we collect the details you provide: your name, phone number, email address, the service you're interested in, your preferred date and time, any notes you add, and any inspiration images you choose to share.",
      "We do not collect payment details through this website. The site does not use advertising trackers.",
    ],
  },
  {
    title: "How we use your information",
    body: [
      "Your details are used solely to arrange and confirm your appointment, prepare for your visit, and respond to your enquiries. Inspiration images are used only to understand the look you want.",
      "We may contact you by phone, WhatsApp, or email about your appointment — for confirmation, rescheduling, or aftercare follow-up.",
    ],
  },
  {
    title: "How we protect your information",
    body: [
      "Your information is kept private and shared with no third parties for marketing purposes. Access is limited to the studio for the purpose of serving you.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can ask us at any time to correct or delete the personal information we hold about you. Simply message the studio on WhatsApp or send an email, and we will act on your request promptly.",
    ],
  },
  {
    title: "Photographs of our work",
    body: [
      "We love sharing finished looks in our gallery and on social media — but only ever with your permission. If you'd prefer your results stay private, just tell us at your appointment; it will always be respected.",
    ],
  },
  {
    title: "Contact",
    body: [
      `Questions about this policy can be directed to ${site.name} at ${site.email} or ${site.phone}.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy Policy"
        title="Your trust, respected"
        description="Plain-language answers about the information you share with the studio, and how it's handled."
      />
      <section className="py-20 md:py-28">
        <Container>
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <p className="text-sm text-muted">Last updated: July 2026</p>
            </Reveal>
            {sections.map((section, i) => (
              <Reveal key={section.title} delay={Math.min(i * 0.05, 0.2)}>
                <h2 className="mt-12 font-serif text-2xl font-medium text-navy md:text-3xl">
                  {section.title}
                </h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="mt-4 text-base leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
