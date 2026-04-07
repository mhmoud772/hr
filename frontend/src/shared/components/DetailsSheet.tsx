import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface DetailItem {
  label: string;
  value: string | number | ReactNode;
}

interface DetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  avatar?: ReactNode;
  badge?: { text: string; variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" };
  details: DetailItem[];
  children?: ReactNode;
}

export function DetailsSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  avatar,
  badge,
  details,
  children,
}: DetailsSheetProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language?.startsWith("ar");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "right" : "left"}
        dir={isRtl ? "rtl" : "ltr"}
        className="w-[95vw] max-w-5xl sm:w-[720px]"
      >
        <SheetHeader className={isRtl ? "text-right" : "text-left"}>
          <div className="flex items-center gap-4">
            {avatar}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-xl">{title}</SheetTitle>
                {badge && (
                  <Badge variant={badge.variant || "default"}>{badge.text}</Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-1 space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {details.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/60 bg-muted/20 p-3 flex flex-col gap-1"
              >
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="font-medium break-words">{item.value}</span>
              </div>
            ))}
          </div>

          {children && (
            <>
              <Separator />
              <div className="space-y-6">{children}</div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

