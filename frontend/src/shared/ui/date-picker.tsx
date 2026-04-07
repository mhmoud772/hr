import * as React from "react"
import { format } from "date-fns"
import { ar, enUS } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"
import { useTranslation } from "react-i18next"

export interface DatePickerProps {
  value?: string | Date;
  onChange?: (date: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  disabled,
  className,
  placeholder,
}: DatePickerProps) {
  const { i18n, t } = useTranslation();
  const date = value ? new Date(value) : undefined;
  const locale = i18n.language?.startsWith("ar") ? ar : enUS;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className={cn("h-4 w-4", i18n.language?.startsWith("ar") ? "ml-2" : "mr-2")} />
          {date ? format(date, "PPP", { locale }) : <span>{placeholder || t("select_date", "Select date")}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => onChange?.(d ? format(d, "yyyy-MM-dd") : "")}
          initialFocus
          // Passing locale directly to support translations out of the box
          locale={locale}
          // The start of the week can be customized per app requirements
          weekStartsOn={i18n.language?.startsWith("ar") ? 6 : 0} 
        />
      </PopoverContent>
    </Popover>
  )
}
