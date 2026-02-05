import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Building2, 
  Fingerprint,
  User,
  BarChart3,
  Settings,
  FileText,
  UserCog,
  FileSearch,
  Wallet,
  Briefcase,
  LineChart,
  GraduationCap,
  Package
} from "lucide-react";
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
} from "@/shared/ui/sidebar";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { canAccessResource } from "@/shared/lib/permissions";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.language === "ar";

  const mainMenuItems = [
    { title: t("dashboard"), url: "/", icon: LayoutDashboard, permission: "reports" },
    { title: t("self_service_title"), url: "/self-service", icon: User, permission: "self_service" },
    { title: t("employees"), url: "/employees", icon: Users, permission: "employees" },
    { title: t("attendance"), url: "/attendance", icon: Clock, permission: "attendance" },
    { title: t("leaves"), url: "/leaves", icon: Calendar, permission: "leaves" },
    { title: t("reports_title"), url: "/reports", icon: BarChart3, permission: "reports" },
  ];

  const managementItems = [
    { title: t("structure"), url: "/structure", icon: Building2, permission: "structure" },
    { title: t("devices"), url: "/devices", icon: Fingerprint, permission: "devices" },
    { title: t("jobTitles"), url: "/job-titles", icon: FileText, permission: "structure" },
    { title: t("users"), url: "/users", icon: UserCog, permission: "users" },
    { title: t("payroll_title"), url: "/payroll", icon: Wallet, permission: "payroll" },
    { title: t("recruitment_title"), url: "/recruitment", icon: Briefcase, permission: "recruitment" },
    { title: t("performance_title"), url: "/performance", icon: LineChart, permission: "performance" },
    { title: t("training_title"), url: "/training", icon: GraduationCap, permission: "training" },
    { title: t("assets_title"), url: "/assets", icon: Package, permission: "assets" },
  ];

  const settingsItems = [
    { title: t("settings"), url: "/settings", icon: Settings, permission: "settings" },
    { title: t("audit_logs_title"), url: "/audit-logs", icon: FileSearch, permission: "settings" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar 
      className="bg-sidebar"
      side={isRtl ? "right" : "left"}
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border/60 bg-[radial-gradient(120px_80px_at_10%_0%,hsl(var(--sidebar-primary)/0.35),transparent)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary/20 ring-1 ring-sidebar-border/60 flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/logo.svg" alt={t("app_name")} className="w-7 h-7" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">{t("app_name")}</span>
              <span className="text-xs text-sidebar-foreground/60">{t("app_subtitle")}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] px-3 mb-2 uppercase tracking-widest">
            {!collapsed && t("main_menu")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems
                .filter((item) => canAccessResource(user, item.permission ?? null))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                      activeClassName="bg-sidebar-primary/20 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/60"
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] px-3 mb-2 uppercase tracking-widest">
            {!collapsed && t("administration")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems
                .filter((item) => canAccessResource(user, item.permission ?? null))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                      activeClassName="bg-sidebar-primary/20 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/60"
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems
                .filter((item) => canAccessResource(user, item.permission ?? null))
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/80 transition-colors hover:text-sidebar-foreground hover:bg-sidebar-accent/70"
                      activeClassName="bg-sidebar-primary/20 text-sidebar-foreground shadow-sm ring-1 ring-sidebar-border/60"
                    >
                      <item.icon className="w-5 h-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
