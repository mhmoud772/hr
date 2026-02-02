import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { i18n, t } = useTranslation();
  const dir = i18n.language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [dir, i18n.language]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full" dir={dir}>
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative">
                <Search className={`absolute ${dir === "rtl" ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input 
                  placeholder={t("search")} 
                  className={`${dir === "rtl" ? "pr-10" : "pl-10"} w-64 bg-background`}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
              <div className={`flex items-center gap-3 ${dir === "rtl" ? "pr-3 border-r" : "pl-3 border-l"} border-border`}>
                <div className={dir === "rtl" ? "text-right" : "text-left"}>
                  <p className="text-sm font-medium">أحمد محمد</p>
                  <p className="text-xs text-muted-foreground">مدير النظام</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
