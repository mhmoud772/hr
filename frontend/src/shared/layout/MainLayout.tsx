import { SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, User, LogOut, Languages, Moon, Sun } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { Badge } from "@/shared/ui/badge";
import { useTheme } from "@/shared/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getNotifications, markAllNotificationsRead, markNotificationsRead } from "@/features/notifications/api/notifications";
import type { Notification } from "@/types/api";
import { canAccessResource, getResourceFromRoute } from "@/shared/lib/permissions";

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { i18n, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  const tSafe = (key: string, ar: string) => (i18n.language.startsWith("ar") ? ar : t(key));
  const currentUser = useMemo(() => {
    const fallback = {
      name: t("default_user_name"),
      role: t("default_user_role"),
    };
    if (!user) return fallback;
    const roleKey = user.role ? `role_${user.role}` : "";
    const roleLabel = roleKey ? t(roleKey as any) : fallback.role;
    return {
      name: user.name || user.username || fallback.name,
      role: roleLabel || user.role || fallback.role,
    };
  }, [user, t]);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [dir, i18n.language]);

  useEffect(() => {
    if (!user) return;
    if (location.pathname === "/not-authorized") return;
    const search = new URLSearchParams(location.search);
    if (
      user.must_change_password &&
      location.pathname === "/settings" &&
      search.get("tab") === "security"
    ) {
      return;
    }
    const resource = getResourceFromRoute(location.pathname);
    if (resource && !canAccessResource(user, resource)) {
      navigate("/not-authorized", { replace: true });
    }
  }, [location.pathname, location.search, navigate, user]);

  const notificationsQuery = useQuery({
    queryKey: ["header-notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 15000,
  });
  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((note: Notification) => !note.read).length;
  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => notificationsQuery.refetch(),
  });
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => notificationsQuery.refetch(),
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const toggleLanguage = async () => {
    const next = i18n.language.startsWith("ar") ? "en" : "ar";
    try {
      await i18n.changeLanguage(next);
      localStorage.setItem("i18nextLng", next);
    } catch {
      // ignore language switch errors
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full" dir={dir}>
        <AppSidebar />

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 -right-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-float-slow" />
            <div className="absolute top-1/3 -left-36 h-80 w-80 rounded-full bg-accent/70 blur-3xl animate-float-slow [animation-delay:2s]" />
          </div>
          {/* Header */}
          <header className="relative z-10 h-16 border-b border-border/60 bg-card/70 shadow-sm backdrop-blur flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative">
                <Search
                  className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
                />
                <Input
                  placeholder={t("search")}
                  className={`${dir === "rtl" ? "pr-10" : "pl-10"} w-64 bg-background/70 shadow-sm`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleLanguage} aria-label={tSafe("language", "اللغة")}>
                <Languages className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={tSafe("theme", "المظهر")}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="w-80">
                  <DropdownMenuLabel>{tSafe("self_service_notifications", "الإشعارات")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">{tSafe("no_data", "لا توجد بيانات")}</div>
                  ) : (
                    <div className="max-h-80 overflow-auto">
                      {notifications.slice(0, 6).map((note: Notification) => (
                        <DropdownMenuItem key={note.id} className="items-start gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{note.title}</p>
                            <p className="text-xs text-muted-foreground">{note.description || "-"}</p>
                          </div>
                          {!note.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.preventDefault();
                                markReadMutation.mutate([note.id]);
                              }}
                            >
                              {tSafe("mark_read", "تعليم كمقروء")}
                            </Button>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                  <div className="flex items-center justify-between px-2 py-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate("/self-service?tab=notifications")}
                    >
                      {tSafe("view_details", "عرض التفاصيل")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={unreadCount === 0}
                      onClick={() => markAllReadMutation.mutate()}
                    >
                      {tSafe("mark_all_read", "تعليم الكل كمقروء")}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                aria-label={t("logout")}
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <div
                className={`flex items-center gap-3 ${dir === "rtl" ? "pr-3 border-r" : "pl-3 border-l"} border-border`}
              >
                <div className={dir === "rtl" ? "text-right" : "text-left"}>
                  <p className="text-sm font-medium">{currentUser.name}</p>
                  <Badge variant="secondary" className="mt-1 text-[10px] px-2 py-0.5">
                    {currentUser.role}
                  </Badge>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 flex-1 p-6 overflow-auto animate-fade-up">
            {/* Use Outlet to render nested routes */}
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

