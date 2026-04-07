import { NavLink } from "@/shared/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
  SidebarFooter,
} from "@/shared/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { canAccessResource } from "@/shared/lib/permissions";
import { NAV_SECTIONS } from "@/shared/lib/navigation";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Search, Settings, HelpCircle, Wifi, WifiOff, LayoutDashboard, UserPlus, FileText, ChevronUp, LogOut, User as UserIcon, Bell } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { useAppStore } from "@/shared/store/appStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Separator } from "@/shared/ui/separator";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.language?.startsWith("ar");
  
  // Connect to our new global state!
  const isOnline = useAppStore((s) => s.isOnline);
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <Sidebar 
      className="border-r border-sidebar-border/80 bg-sidebar/95 text-sidebar-foreground shadow-[0_24px_48px_-28px_hsl(var(--sidebar-background)/0.85)] backdrop-blur-2xl transition-all duration-300"
      side={isRtl ? "right" : "left"}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border/80 bg-gradient-to-b from-sidebar-primary/12 via-sidebar-background to-sidebar-background p-4">
        <div className="flex items-center gap-3">
          <div className="relative group/logo">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 ring-4 ring-primary/10 flex items-center justify-center shadow-lg overflow-hidden transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:rotate-3">
              <img src="/logo.svg" alt={t("app_name")} className="w-6 h-6 invert brightness-0" />
            </div>
            {isOnline && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-2 ring-background">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-500">
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60 tracking-tight leading-none">
                {t("app_name")}
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">
                  {t("badge_pro")}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/65">
                  {t("app_subtitle")}
                </span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 gap-6 scrollbar-none">
        <div className="px-1 space-y-4">
          <Button
            variant="outline"
            onClick={() => setCommandOpen(true)}
            className={`group/search relative h-10 w-full justify-start gap-3 overflow-hidden rounded-xl border border-sidebar-border/80 bg-sidebar-accent/80 text-sidebar-foreground/90 shadow-sm transition-all duration-300 hover:bg-sidebar-accent hover:text-sidebar-foreground ${collapsed ? "justify-center px-0" : ""}`}
          >
            <Search className="w-4 h-4 shrink-0 transition-colors group-hover/search:text-primary" />
            {!collapsed && (
              <>
                <span className="text-sm font-medium tracking-tight">{t("search")}</span>
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover/search:opacity-100 transition-opacity">
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border/70 bg-sidebar/90 px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/75 transition-all group-hover/search:border-primary/50">
                    <span className="text-[10px]">Ctrl</span>K
                  </kbd>
                </div>
              </>
            )}
          </Button>

          {!collapsed && (
            <div className="px-1 flex flex-col gap-2">
              <p className="px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/55">
                {t("quick_access")}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { icon: LayoutDashboard, url: "/", label: t("dashboard") },
                  { icon: UserPlus, url: "/employees", label: t("add_employee") },
                  { icon: FileText, url: "/reports", label: t("reports") }
                ].map((quick, i) => (
                  <TooltipProvider key={i}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink 
                          to={quick.url} 
                          className="flex h-9 items-center justify-center rounded-lg border border-sidebar-border/40 bg-sidebar-accent/70 text-sidebar-foreground/80 transition-all duration-300 hover:border-primary/25 hover:bg-sidebar-primary/15 hover:text-sidebar-foreground"
                        >
                          <quick.icon className="w-4 h-4" />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="text-[10px]">{quick.label}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>

        {NAV_SECTIONS.map((section, sectionIndex) => (
          <SidebarGroup key={section.id} className={sectionIndex > 0 ? "mt-2" : undefined}>
            {section.labelKey && !collapsed && (
              <SidebarGroupLabel className="animate-fade-in mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/55">
                {t(section.labelKey)}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items
                  .filter((item) => canAccessResource(user, item.permission ?? null))
                  .map((item) => {
                    const active = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.url}>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip disableHoverableContent>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton
                                asChild
                                isActive={active}
                                tooltip={collapsed ? undefined : undefined}
                              >
                                <NavLink
                                  to={item.url}
                                  end={item.url === "/"}
                                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 overflow-hidden group
                                    ${active 
                                      ? "bg-sidebar-primary/20 text-sidebar-primary-foreground shadow-[inset_0px_1px_1px_hsl(var(--sidebar-foreground)/0.08)] ring-1 ring-sidebar-primary/35" 
                                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/90 hover:text-sidebar-foreground"
                                    }`}
                                >
                                  {active && (
                                    <div className={`absolute ${isRtl ? "right-0" : "left-0"} top-1/2 -translate-y-1/2 h-1/2 w-1 rounded-r-md bg-sidebar-primary animate-fade-in`} />
                                  )}
                                  <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`} />
                                  {!collapsed && <span className="whitespace-nowrap font-semibold tracking-tight">{t(item.titleKey)}</span>}
                                </NavLink>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            {collapsed && (
                              <TooltipContent side={isRtl ? "left" : "right"} className="font-medium">
                                {t(item.titleKey)}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/80 bg-sidebar/90 p-3 backdrop-blur-md">
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="group/user w-full rounded-xl text-sidebar-foreground transition-all duration-300 hover:bg-sidebar-accent/90 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="relative">
                  <Avatar className="h-9 w-9 border-2 border-primary/20 group-hover/user:border-primary/40 transition-colors">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 ${isRtl ? 'left-0' : 'right-0'} h-3 w-3 rounded-full border-2 border-background ${isOnline ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                </div>
                {!collapsed && (
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-bold truncate w-full tracking-tight">
                      {user?.name || "User Name"}
                    </span>
                    <span className="w-full truncate text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/60">
                      {user?.role ? t(`role_${user.role}`) : t("role_employee")}
                    </span>
                  </div>
                )}
                {!collapsed && <ChevronUp className="ml-auto h-4 w-4 text-sidebar-foreground/60 transition-transform group-hover/user:translate-y-[-2px]" />}
              </div>
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent 
            side={collapsed ? (isRtl ? "left" : "right") : "top"} 
            align="start" 
            className="w-64 p-2 rounded-2xl border-border/50 shadow-2xl backdrop-blur-2xl bg-background/95"
          >
            <div className="flex flex-col gap-1">
              <div className="px-3 py-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {t("manage_account")}
                </p>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-accent/30 border border-accent/20">
                   <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                     {t("active_session")}
                   </span>
                </div>
              </div>
              <Separator className="my-1 opacity-50" />
              <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl h-10 hover:bg-primary/5 hover:text-primary transition-all group/opt" onClick={() => window.location.href = "/self-service"}>
                <UserIcon className="h-4 w-4 text-muted-foreground group-hover/opt:text-primary transition-colors" />
                <span className="text-sm font-medium">{t("my_profile")}</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl h-10 hover:bg-primary/5 hover:text-primary transition-all group/opt" onClick={() => window.location.href = "/settings"}>
                <Settings className="h-4 w-4 text-muted-foreground group-hover/opt:text-primary transition-colors" />
                <span className="text-sm font-medium">{t("settings")}</span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl h-10 hover:bg-primary/5 hover:text-primary transition-all group/opt">
                <Bell className="h-4 w-4 text-muted-foreground group-hover/opt:text-primary transition-colors" />
                <span className="text-sm font-medium">{t("notifications")}</span>
              </Button>
              <Separator className="my-1 opacity-50" />
              <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl h-10 text-destructive hover:bg-destructive/10 hover:text-destructive transition-all group/logout" onClick={() => window.location.href = "/login"}>
                <LogOut className="h-4 w-4 group-hover/logout:translate-x-1 transition-transform rtl:group-hover/logout:-translate-x-1" />
                <span className="text-sm font-bold">{t("logout")}</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarFooter>
    </Sidebar>
  );
}
