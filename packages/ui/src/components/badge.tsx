import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "../lib/cn";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
  {
    variants: {
      variant: {
        blue: "bg-action-soft text-action",
        violet: "bg-accent-violet-soft text-accent-violet",
        amber: "bg-accent-amber text-brand-navy-900",
        success: "bg-success-soft text-success",
        solid: "bg-action text-white",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: { variant: "blue" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
