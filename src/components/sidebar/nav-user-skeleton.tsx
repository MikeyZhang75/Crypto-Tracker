"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <SidebarMenuButton size="lg" className="pointer-events-none">
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Skeleton className="h-8 w-8 rounded-lg" />
            </motion.div>
            <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.2,
                }}
              >
                <Skeleton className="h-4 w-24" />
              </motion.div>
              <motion.div
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              >
                <Skeleton className="h-3 w-32" />
              </motion.div>
            </div>
            <motion.div
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.6,
              }}
            >
              <Skeleton className="ml-auto h-4 w-4" />
            </motion.div>
          </SidebarMenuButton>
        </motion.div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}