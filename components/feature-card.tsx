import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-line bg-white p-7 shadow-soft transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-lift">
      <span className="inline-flex size-11 items-center justify-center rounded-xl bg-paper text-royal">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-5 font-serif text-xl font-medium text-navy">{title}</h3>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
