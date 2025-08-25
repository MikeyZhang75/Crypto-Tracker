"use client";

import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AudioWaveform,
  ChartBar,
  Command,
  GalleryVerticalEnd,
  Wallet,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import { NavUserSkeleton } from "@/components/sidebar/nav-user-skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import { useTranslation } from "@/i18n/use-translation";
import LanguageSelector from "./language-selector";

// Animation configuration following Material Design guidelines
export const ANIMATION_CONFIG = {
  // Desktop: 200ms, Mobile: 300ms (Material Design standards)
  duration: 0.2, // 200ms for desktop
  // Easing curves for different animation types
  easing: {
    enter: [0, 0, 0.2, 1], // ease-out (decelerate) for entering
    exit: [0.4, 0, 1, 1], // ease-in (accelerate) for exiting
    standard: [0.4, 0, 0.2, 1], // ease-in-out for general transitions
  },
  spring: {
    damping: 20,
    stiffness: 300,
    mass: 0.8,
  },
} as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useQuery(api.users.getCurrentUser);
  const t = useTranslation();

  // Navigation data with translations
  const data = {
    teams: [
      {
        name: "Acme Inc",
        logo: GalleryVerticalEnd,
        plan: "Enterprise",
      },
      {
        name: "Acme Corp.",
        logo: AudioWaveform,
        plan: "Startup",
      },
      {
        name: "Evil Corp.",
        logo: Command,
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: t.nav.dashboard,
        url: "/",
        icon: ChartBar,
        isActive: true,
      },
      {
        title: t.nav.addresses,
        url: "/addresses",
        icon: Wallet,
        isActive: true,
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader> */}
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <ThemeToggle />
          <LanguageSelector />
        </SidebarMenu>
        <SidebarSeparator />
        <AnimatePresence mode="wait">
          {currentUser === undefined ? (
            <NavUserSkeleton key="skeleton" />
          ) : currentUser === null ? // User is logged out or no user found
          null : (
            <motion.div
              key="user"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: ANIMATION_CONFIG.duration,
                ease: ANIMATION_CONFIG.easing.enter,
              }}
            >
              <NavUser
                user={{
                  name: currentUser.name,
                  email: currentUser.email,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
