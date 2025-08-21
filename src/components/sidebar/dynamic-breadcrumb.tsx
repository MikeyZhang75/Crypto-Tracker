"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Generate breadcrumb items from pathname
function generateBreadcrumbs(pathname: string) {
  // Remove leading slash and split by slash
  const segments = pathname.split("/").filter(Boolean);

  // Filter out route groups like (protected) and (public)
  const cleanSegments = segments.filter(
    (segment) => !segment.startsWith("(") || !segment.endsWith(")"),
  );

  const breadcrumbs: Array<{
    label: string;
    href: string;
    isLast: boolean;
  }> = [];

  // Add breadcrumbs for each segment
  cleanSegments.forEach((segment, index) => {
    const isLast = index === cleanSegments.length - 1;
    const href = `/${cleanSegments.slice(0, index + 1).join("/")}`;
    
    // Format the label - handle long IDs by truncating them
    let label = segment;
    
    // Check if this looks like an ID (long alphanumeric string)
    if (segment.length > 20 && /^[a-z0-9]+$/i.test(segment)) {
      // Show first 6 and last 4 characters with ellipsis
      label = `${segment.slice(0, 6)}...${segment.slice(-4)}`;
    } else {
      // Regular formatting for non-ID segments
      label = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    breadcrumbs.push({
      label,
      href,
      isLast,
    });
  });

  return breadcrumbs;
}

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);

  // Don't render breadcrumb if we're at the root or have no breadcrumbs
  if (pathname === "/" || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center">
            <BreadcrumbItem>
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
