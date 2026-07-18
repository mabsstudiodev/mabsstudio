import { Container } from "@/components/container";
import { Reveal } from "@/components/motion";

export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="bg-veil">
      <Container>
        <div className="mx-auto max-w-3xl pb-16 pt-36 text-center md:pb-20 md:pt-44">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">{eyebrow}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.05] text-navy md:text-6xl">
              {title}
            </h1>
          </Reveal>
          {description && (
            <Reveal delay={0.2}>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted md:text-lg">
                {description}
              </p>
            </Reveal>
          )}
        </div>
      </Container>
    </section>
  );
}
