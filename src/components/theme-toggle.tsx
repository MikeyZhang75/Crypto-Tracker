"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const getIcon = () => {
    if (theme === "dark") return <Moon className="h-4 w-4" />;
    if (theme === "system") return <Laptop className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  const getLabel = () => {
    if (theme === "dark") return "Dark";
    if (theme === "system") return "System";
    return "Light";
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="cursor-pointer">
              {getIcon()}
              <span>{getLabel()}</span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[150px]">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="h-4 w-4" />
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="h-4 w-4" />
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Laptop className="h-4 w-4" />
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
