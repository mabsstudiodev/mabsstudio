import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion";

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      <p
        className={cn(
          "flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-royal",
          align === "center" && "justify-center"
        )}
      >
        {align === "center" && (
          <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-transparent to-blush/70" />
        )}
        {eyebrow}
        <span aria-hidden="true" className="h-px w-8 bg-gradient-to-l from-transparent to-blush/70" />
      </p>
      <h2 className="mt-4 font-serif text-4xl font-medium leading-[1.1] text-navy md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{description}</p>
      )}
    </Reveal>
  );
}
