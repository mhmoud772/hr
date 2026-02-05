import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import type { ReactNode } from "react";

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
  badge?: { text: string; variant?: "default" | "secondary" | "destructive" | "outline" };
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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[400px] sm:w-[540px]" dir="rtl">
        <SheetHeader className="text-right">
          <div className="flex items-center gap-4">
            {avatar}
            <div className="flex-1">
              <div className="flex items-center gap-2">
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
        
        <div className="space-y-4">
          {details.map((item, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
        
        {children && (
          <>
            <Separator className="my-4" />
            {children}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

