import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  Calendar, 
  Building2, 
  Fingerprint,
  Settings,
  FileText,
  UserCog
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
} from "@/components/ui/sidebar";

const mainMenuItems = [
  { title: "لوحة التحكم", url: "/", icon: LayoutDashboard },
  { title: "الموظفين", url: "/employees", icon: Users },
  { title: "الحضور والانصراف", url: "/attendance", icon: Clock },
  { title: "الإجازات", url: "/leaves", icon: Calendar },
];

const managementItems = [
  { title: "الهيكل الإداري", url: "/structure", icon: Building2 },
  { title: "أجهزة البصمة", url: "/devices", icon: Fingerprint },
  { title: "المسميات الوظيفية", url: "/job-titles", icon: FileText },
  { title: "المستخدمين", url: "/users", icon: UserCog },
];

const settingsItems = [
  { title: "الإعدادات", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar 
      className="border-l border-sidebar-border bg-sidebar"
      side="right"
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sidebar-foreground">نظام الموارد البشرية</span>
              <span className="text-xs text-muted-foreground">إدارة الموظفين</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs px-3 mb-2">
            {!collapsed && "القائمة الرئيسية"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/"} 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                      activeClassName="bg-primary text-primary-foreground"
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
          <SidebarGroupLabel className="text-muted-foreground text-xs px-3 mb-2">
            {!collapsed && "الإدارة"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                      activeClassName="bg-primary text-primary-foreground"
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
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                  >
                    <NavLink 
                      to={item.url} 
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
                      activeClassName="bg-primary text-primary-foreground"
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
