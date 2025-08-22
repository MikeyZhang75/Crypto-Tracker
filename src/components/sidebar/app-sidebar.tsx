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
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";

// This is sample data.
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
      title: "Dashboard",
      url: "/",
      icon: ChartBar,
      isActive: true,
    },
    {
      title: "Addresses",
      url: "/addresses",
      icon: Wallet,
      isActive: true,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const currentUser = useQuery(api.users.getCurrentUser);

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader> */}
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
        <SidebarSeparator />
        <AnimatePresence mode="wait">
          {currentUser === undefined ? (
            <NavUserSkeleton key="skeleton" />
          ) : (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <NavUser
                user={{
                  name: currentUser?.name || "Unknown User",
                  email: currentUser?.email || "Unknown Email",
                  avatar: currentUser?.image || "/avatars/default.jpg",
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
