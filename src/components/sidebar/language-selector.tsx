"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { type Language, useLanguage } from "@/provider/language-provider";

const languages = [
  { value: "en-US" as Language, label: "English", flag: "🇺🇸" },
  { value: "zh-CN" as Language, label: "简体中文", flag: "🇨🇳" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const currentLanguage =
    languages.find((lang) => lang.value === language) || languages[0];

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="cursor-pointer [&>span]:flex [&>span]:items-center [&>span]:gap-2">
            <span className="text-lg leading-none">{currentLanguage.flag}</span>
            <span className="truncate">{currentLanguage.label}</span>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[200px] [&_*[role=menuitem]]:ps-2 [&_*[role=menuitem]]:pe-8 [&_*[role=menuitem]>span]:flex [&_*[role=menuitem]>span]:items-center [&_*[role=menuitem]>span]:gap-2"
        >
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              className="cursor-pointer"
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span className="truncate">{lang.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
