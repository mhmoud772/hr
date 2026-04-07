import type { ComponentProps, ReactNode } from "react";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  dir?: "rtl" | "ltr";
  className?: string;
};

export function AuthShell({ children, dir, className }: AuthShellProps) {
  return (
    <div
      dir={dir}
      className={cn(
        "min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-background",
        "bg-[radial-gradient(140%_140%_at_0%_0%,hsl(var(--primary)/0.18),transparent_55%),radial-gradient(140%_140%_at_100%_0%,hsl(var(--accent)/0.18),transparent_55%),radial-gradient(120%_120%_at_50%_100%,hsl(var(--secondary)/0.18),transparent_60%)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-float-slow"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-success/20 blur-3xl animate-float-fast"
      />
      {children}
    </div>
  );
}

type AuthCardProps = ComponentProps<typeof Card>;

export function AuthCard({ className, children, ...props }: AuthCardProps) {
  return (
    <Card
      className={cn(
        "relative w-full border border-border/60 bg-card/90 shadow-2xl backdrop-blur-xl overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-info/60 to-success/70" />
      {children}
    </Card>
  );
}
