import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip";

type IconActionButtonProps = Omit<ButtonProps, "size" | "children"> & {
  label: string;
  children: ReactNode;
  tooltip?: boolean;
};

export function IconActionButton({
  label,
  children,
  tooltip = true,
  variant = "ghost",
  className,
  ...props
}: IconActionButtonProps) {
  const button = (
    <Button
      size="icon"
      variant={variant}
      aria-label={label}
      title={label}
      className={className}
      {...props}
    >
      {children}
    </Button>
  );

  if (!tooltip) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
