import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useTranslation } from "react-i18next";

type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type SortOption = { value: string; label: string };

type SortProps = {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
};

type TableToolbarProps = {
  className?: string;
  search?: SearchProps;
  filters?: ReactNode;
  sort?: SortProps;
  actions?: ReactNode;
};

export function TableToolbar({ className, search, filters, sort, actions }: TableToolbarProps) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === "ar";

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
        {search ? (
          <div className="relative w-full sm:w-72">
            <Search
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary",
                isRtl ? "right-3" : "left-3"
              )}
            />
            <Input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder}
              className={cn(
                "w-full bg-background/50 border-border/60 focus:bg-background transition-all",
                isRtl ? "pr-10" : "pl-10"
              )}
            />
          </div>
        ) : null}

        {filters || sort ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-1.5 min-h-[52px]">
            {filters ? <div className="flex flex-wrap items-center gap-2 px-1">{filters}</div> : null}
            {sort ? (
              <Select value={sort.value} onValueChange={sort.onChange}>
                <SelectTrigger className="w-full sm:w-48 bg-background/50 border-none shadow-none focus:ring-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sort.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap gap-2 justify-start sm:justify-end rounded-xl border border-border/60 bg-muted/20 p-1.5 min-h-[52px]">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
