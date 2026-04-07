import { SidebarProvider, SidebarTrigger } from "@/shared/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Languages, 
  Moon, 
  Sun, 
  HelpCircle, 
  Wifi, 
  WifiOff, 
  Lock, 
  MoreVertical, 
  Settings,
  Plus,
  UserPlus,
  CalendarPlus,
  FilePlus,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/shared/store/appStore";
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/features/auth/components/AuthProvider";
import { useTheme } from "@/shared/components/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
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
import { CommandPalette } from "@/shared/components/CommandPalette";
import { useRealtimeNotifications, requestNotificationPermission } from "@/features/notifications/hooks/useRealtimeNotifications";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { i18n, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Smart polling-based real-time notifications (15s interval)
  useRealtimeNotifications();

  // Request browser notification permission once on mount
  useEffect(() => { requestNotificationPermission(); }, []);

  const commandOpen = useAppStore((state) => state.commandOpen);
  const setCommandOpen = useAppStore((state) => state.setCommandOpen);
  const isOnline = useAppStore((state) => state.isOnline);
  const setOnline = useAppStore((state) => state.setOnline);
  const dir = i18n.language === "ar" ? "rtl" : "ltr";
  const tSafe = (key: string, ar: string) => (i18n.language.startsWith("ar") ? ar : t(key));
  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || "support@example.com";
  
  const currentUser = useMemo(() => {
    const fallback = {
      name: t("default_user_name"),
      role: t("default_user_role"),
    };
    if (!user) return fallback;
    const roleKey = user.role ? `role_${user.role}` : "";
    const roleLabel = roleKey ? t(roleKey) : fallback.role;
    return {
      name: user.name || user.username || fallback.name,
      role: roleLabel || user.role || fallback.role,
      avatar: user.avatar,
    };
  }, [user, t]);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [dir, i18n.language]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

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
    enabled: Boolean(user && canAccessResource(user, "notifications")),
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

  const handleLock = async () => {
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

  // Generate breadcrumbs from path
  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split("/").filter(Boolean);
    const result = [{ label: t("dashboard"), path: "/", icon: LayoutDashboard }];
    
    let currentPath = "";
    paths.forEach((p) => {
      currentPath += `/${p}`;
      // Map path to translation keys
      let label = p;
      if (p === "employees") label = t("employees");
      else if (p === "attendance") label = t("attendance");
      else if (p === "leaves") label = t("leaves");
      else if (p === "devices") label = t("devices");
      else if (p === "device-command-center") label = t("command_center");
      else if (p === "settings") label = t("settings");
      else if (p === "payroll") label = t("payroll");
      else if (p === "recruitment") label = t("recruitment");
      else if (p === "performance") label = t("performance");
      else if (p === "self-service") label = t("self_service_title");
      else if (p === "reports") label = t("reports");
      else if (p === "structure") label = t("structure");
      else if (p === "assets") label = t("assets");
      else if (p === "users") label = t("users");
      else if (p === "add") label = t("add");
      
      result.push({ label, path: currentPath, icon: null });
    });
    
    return result;
  }, [location.pathname, t]);

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
          <header className="relative z-20 border-b border-border/60 bg-card/70 shadow-sm backdrop-blur-xl flex items-center justify-between gap-2 px-4 h-16 sm:px-6 sticky top-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
              
              <div className="hidden lg:flex items-center gap-2 overflow-hidden">
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, i) => (
                      <div key={crumb.path} className="flex items-center">
                        <BreadcrumbItem>
                          {i === breadcrumbs.length - 1 ? (
                            <BreadcrumbPage className="font-bold text-foreground truncate max-w-[150px]">
                              {crumb.label}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={crumb.path} className="flex items-center gap-1 hover:text-primary transition-colors">
                                {crumb.icon && <crumb.icon className="w-3.5 h-3.5" />}
                                <span className="truncate max-w-[100px]">{crumb.label}</span>
                              </Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {i < breadcrumbs.length - 1 && (
                          <BreadcrumbSeparator>
                            {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </BreadcrumbSeparator>
                        )}
                      </div>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="hidden sm:flex gap-2 rounded-full shadow-lg shadow-primary/20 animate-in fade-in zoom-in duration-300">
                    <Plus className="w-4 h-4" />
                    <span>{t("add")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="w-56 p-2 rounded-xl">
                  <DropdownMenuLabel className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                    {t("quick_actions")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-lg" onClick={() => navigate("/employees/add")}>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="font-medium">{t("add_employee")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-lg" onClick={() => navigate("/leaves?modal=request")}>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <CalendarPlus className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="font-medium">{t("request_leave")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-lg" onClick={() => navigate("/attendance?modal=add")}>
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <FilePlus className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="font-medium">{t("add_attendance_manual")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Search & Quick Add icons */}
              <div className="flex sm:hidden items-center gap-1">
                 <Button variant="ghost" size="icon" onClick={() => setCommandOpen(true)}>
                   <Search className="w-5 h-5" />
                 </Button>
              </div>

              {/* Desktop Search Button */}
              <div className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setCommandOpen(true)}
                  aria-label={t("search")}
                >
                  <Search className="w-5 h-5" />
                </Button>
              </div>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative group">
                    <Bell className="w-5 h-5 transition-transform group-hover:rotate-12" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center animate-bounce">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="w-80 p-0 rounded-2xl overflow-hidden shadow-2xl border-border/50">
                  <div className="bg-primary/5 p-4 border-b border-border/50 flex items-center justify-between">
                    <h3 className="font-bold text-sm">{tSafe("self_service_notifications", "الإشعارات")}</h3>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-[10px] uppercase">{unreadCount} {t("pending")}</Badge>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-6 py-10 text-center flex flex-col items-center gap-2">
                       <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center opacity-20">
                          <Bell className="w-6 h-6" />
                       </div>
                       <p className="text-sm text-muted-foreground">{tSafe("no_data", "لا توجد بيانات")}</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-auto py-2">
                      {notifications.slice(0, 6).map((note: Notification) => (
                        <DropdownMenuItem key={note.id} className="px-4 py-3 items-start gap-3 cursor-pointer hover:bg-accent/50 group/item">
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${note.read ? 'bg-transparent' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover/item:text-primary transition-colors">{note.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{note.description || "-"}</p>
                          </div>
                          {!note.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault();
                                markReadMutation.mutate([note.id]);
                              }}
                            >
                              <div className="h-4 w-4 border-2 border-primary rounded-full" />
                            </Button>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                  <DropdownMenuSeparator className="m-0" />
                  <div className="flex items-center justify-between p-2 bg-muted/30">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold"
                      onClick={() => navigate("/self-service?tab=notifications")}
                    >
                      {tSafe("view_details", "عرض التفاصيل")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold text-primary"
                      disabled={unreadCount === 0}
                      onClick={() => markAllReadMutation.mutate()}
                    >
                      {tSafe("mark_all_read", "تعليم الكل كمقروء")}
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Unified User Dropdown (Replaces multiple buttons) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 pl-1 rounded-full hover:bg-accent transition-all group outline-none">
                    <div className="relative">
                      <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-transparent group-hover:border-primary/20 transition-all shadow-sm">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                          {currentUser.name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-muted-foreground'}`}>
                        {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></span>}
                      </div>
                    </div>
                    <div className="hidden lg:flex flex-col items-start pr-1 min-w-0">
                      <span className="text-xs font-bold truncate max-w-[100px] leading-tight">{currentUser.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate leading-tight uppercase font-medium">{currentUser.role}</span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="w-64 p-2 rounded-2xl shadow-2xl border-border/50">
                  <div className="px-3 py-3 mb-2 rounded-xl bg-accent/20 flex flex-col gap-1 items-center text-center">
                    <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback className="text-sm font-bold">{currentUser.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-bold mt-1">{currentUser.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{currentUser.role}</p>
                  </div>
                  
                  <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 mb-1">
                    {tSafe("settings", "إعدادات")}
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-xl" onClick={toggleLanguage}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Languages className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 flex items-center justify-between">
                      <span className="font-medium">{tSafe("language", "اللغة")}</span>
                      <Badge variant="secondary" className="text-[9px] uppercase">{i18n.language.startsWith("ar") ? "English" : "العربية"}</Badge>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-xl" onClick={toggleTheme}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      {theme === "dark" ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="font-medium">{tSafe("theme", "المظهر")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-xl" onClick={() => navigate("/self-service")}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{t("my_profile")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-xl" onClick={() => navigate("/settings")}>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{t("settings")}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="gap-3 p-2.5 cursor-pointer rounded-xl">
                    <a href={`mailto:${supportEmail}`}>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <HelpCircle className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{tSafe("support", "الدعم")}</span>
                    </a>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-xl" onClick={handleLock}>
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="font-medium">{t("lock")}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem className="gap-3 p-2.5 cursor-pointer rounded-xl text-destructive hover:text-destructive" onClick={handleLogout}>
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="font-bold">{t("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content */}
          <main className="relative z-10 flex-1 p-4 sm:p-6 overflow-auto animate-fade-up">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </SidebarProvider>
  );
}
