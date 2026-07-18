import Link from "next/link";
import { Container } from "@/components/container";

export default function NotFound() {
  return (
    <section className="bg-veil">
      <Container>
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center pt-20 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-royal">404</p>
          <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.05] text-navy md:text-6xl">
            This page has moved on
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted">
            The page you&apos;re looking for doesn&apos;t exist — but the studio is very much
            here.
          </p>
          <Link
            href="/"
            className="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-navy px-8 text-sm font-medium tracking-wide text-white transition-colors duration-300 hover:bg-royal"
          >
            Back to Home
          </Link>
        </div>
      </Container>
    </section>
  );
}
