import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/shared/ui/command";
import { NAV_SECTIONS } from "@/shared/lib/navigation";
import type { NavItem } from "@/shared/lib/navigation";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const items = useMemo<NavItem[]>(() => NAV_SECTIONS.flatMap((section) => section.items), []);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={t("command_palette_placeholder")} />
      <CommandList>
        <CommandEmpty>{t("no_results")}</CommandEmpty>
        {items.length > 0 && (
          <CommandGroup heading={t("quick_actions")}>
            {items.map((item) => (
              <CommandItem
                key={item.url}
                value={item.titleKey}
                onSelect={() => {
                  navigate(item.url);
                  onOpenChange(false);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{t(item.titleKey)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
