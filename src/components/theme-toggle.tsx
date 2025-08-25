"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useTranslation } from "@/i18n/use-translation";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const t = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getIcon = () => {
    if (!mounted) return <Laptop className="h-4 w-4" />;
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    if (theme === "system") return <Laptop className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="cursor-pointer">
            {getIcon()}
            <span>{t.common.theme}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[150px]">
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="h-4 w-4" />
            {t.settings.lightMode}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="h-4 w-4" />
            {t.settings.darkMode}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Laptop className="h-4 w-4" />
            {t.settings.systemMode}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
