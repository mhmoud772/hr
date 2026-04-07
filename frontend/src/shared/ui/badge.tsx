import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "border-secondary/20 bg-secondary/10 text-secondary hover:bg-secondary/20",
        success: "border-success/20 bg-success/10 text-success hover:bg-success/20",
        warning: "border-warning/20 bg-warning/10 text-warning hover:bg-warning/20",
        info: "border-info/20 bg-info/10 text-info hover:bg-info/20",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
        outline: "border-border/60 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

