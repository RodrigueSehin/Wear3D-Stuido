import * as React from "react";
import { cn } from "../lib/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "border-border bg-surface text-foreground placeholder:text-muted-foreground focus-visible:ring-ring h-12 w-full rounded-md border px-4 text-sm focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
