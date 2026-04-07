import {
  BarChart3,
  Boxes,
  Briefcase,
  CalendarClock,
  Clock,
  Cpu,
  FolderSync,
  GraduationCap,
  LayoutDashboard,
  Leaf,
  Network,
  ScrollText,
  Settings,
  TrendingUp,
  UserCircle,
  UserCog,
  UserPlus,
  Users2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  titleKey: string;
  url: string;
  icon: LucideIcon;
  permission?: string | null;
};

type NavSection = {
  id: string;
  labelKey?: string;
  items: NavItem[];
};

const INSIGHTS_ITEMS: NavItem[] = [
  { titleKey: "dashboard", url: "/", icon: LayoutDashboard, permission: "reports" },
  { titleKey: "reports", url: "/reports", icon: BarChart3, permission: "reports" },
];

const PEOPLE_ITEMS: NavItem[] = [
  { titleKey: "employees", url: "/employees", icon: Users2, permission: "employees" },
  { titleKey: "structure", url: "/structure", icon: Network, permission: "structure" },
  { titleKey: "jobTitles", url: "/job-titles", icon: Briefcase, permission: "structure" },
  { titleKey: "recruitment", url: "/recruitment", icon: UserPlus, permission: "recruitment" },
  { titleKey: "performance", url: "/performance", icon: TrendingUp, permission: "performance" },
  { titleKey: "training", url: "/training", icon: GraduationCap, permission: "training" },
];

const OPERATIONS_ITEMS: NavItem[] = [
  { titleKey: "attendance", url: "/attendance", icon: CalendarClock, permission: "attendance" },
  { titleKey: "leaves", url: "/leaves", icon: Leaf, permission: "leaves" },
  { titleKey: "shifts", url: "/shifts", icon: Clock, permission: "attendance" },
  { titleKey: "payroll", url: "/payroll", icon: Wallet, permission: "payroll" },
];

const TECH_ITEMS: NavItem[] = [
  { titleKey: "assets", url: "/assets", icon: Boxes, permission: "assets" },
  { titleKey: "devices", url: "/devices", icon: Cpu, permission: "devices" },
  { titleKey: "command_center", url: "/device-command-center", icon: FolderSync, permission: "devices" },
];

const SYSTEM_ITEMS: NavItem[] = [
  { titleKey: "users", url: "/users", icon: UserCog, permission: "users" },
  { titleKey: "audit_logs_title", url: "/audit-logs", icon: ScrollText, permission: "settings" },
  { titleKey: "settings", url: "/settings", icon: Settings, permission: "settings" },
];

const SELF_SERVICE_ITEMS: NavItem[] = [
  { titleKey: "self_service_title", url: "/self-service", icon: UserCircle, permission: "self_service" },
];

export const NAV_SECTIONS: NavSection[] = [
  { id: "insights", labelKey: "nav_section_insights", items: INSIGHTS_ITEMS },
  { id: "people", labelKey: "nav_section_people", items: PEOPLE_ITEMS },
  { id: "operations", labelKey: "nav_section_operations", items: OPERATIONS_ITEMS },
  { id: "tech", labelKey: "nav_section_tech", items: TECH_ITEMS },
  { id: "self-service", labelKey: "nav_section_self_service", items: SELF_SERVICE_ITEMS },
  { id: "system", labelKey: "nav_section_system", items: SYSTEM_ITEMS },
];

export type { NavItem, NavSection };
