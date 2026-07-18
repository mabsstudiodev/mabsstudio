import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-32 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted/70 transition-colors duration-300 hover:border-navy/30 focus:border-navy focus:outline-none aria-[invalid=true]:border-red-400",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
