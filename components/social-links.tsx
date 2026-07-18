import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

// Lucide dropped brand marks, so these minimal inline glyphs keep the set consistent.
type IconProps = { className?: string };

function BrandIcon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function InstagramIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </BrandIcon>
  );
}

function TikTokIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className}>
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </BrandIcon>
  );
}

function FacebookIcon({ className }: IconProps) {
  return (
    <BrandIcon className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </BrandIcon>
  );
}

const platforms = [
  { name: "Instagram", href: site.social.instagram, Icon: InstagramIcon },
  { name: "TikTok", href: site.social.tiktok, Icon: TikTokIcon },
  { name: "Facebook", href: site.social.facebook, Icon: FacebookIcon },
].filter((p) => p.href);

export function hasSocialLinks() {
  return platforms.length > 0;
}

export function SocialLinks({ className }: { className?: string }) {
  if (platforms.length === 0) return null;
  return (
    <ul className={cn("flex items-center gap-3", className)}>
      {platforms.map(({ name, href, Icon }) => (
        <li key={name}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${site.name} on ${name}`}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-line text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white"
          >
            <Icon className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
