import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-line bg-white px-4 text-sm text-ink placeholder:text-muted/70 transition-colors duration-300 hover:border-navy/30 focus:border-navy focus:outline-none aria-[invalid=true]:border-red-400 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-navy",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
