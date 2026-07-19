import Link from "next/link";
import { Clock } from "lucide-react";
import type { Service } from "@/lib/services";
import { StudioImage } from "@/components/studio-image";

export function ServiceCard({ service, index }: { service: Service; index: number }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-lift">
      <div className="relative aspect-square overflow-hidden">
        {service.video ? (
          <video
            src={service.video}
            poster={service.image}
            muted
            loop
            autoPlay
            playsInline
            aria-label={service.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        ) : (
          <StudioImage
            src={service.image}
            alt={service.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute left-5 top-5 font-serif text-sm tracking-[0.2em] text-navy/70">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-serif text-2xl font-medium text-navy">{service.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{service.description}</p>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-5">
          <p className="text-sm font-medium text-navy">{service.price}</p>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Clock className="size-3.5" aria-hidden="true" />
            {service.duration}
          </p>
        </div>
        <Link
          href={`/book?service=${service.slug}`}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-navy/25 px-6 text-sm font-medium tracking-wide text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white"
          aria-label={`Book ${service.title}`}
        >
          Book Appointment
        </Link>
      </div>
    </article>
  );
}
