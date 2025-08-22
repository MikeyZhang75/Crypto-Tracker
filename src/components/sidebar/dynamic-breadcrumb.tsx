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

// Regex patterns for different segment types
const PATTERNS = {
  // Route groups like (protected) or (public)
  ROUTE_GROUP: /^\(.+\)$/,

  // Convex IDs - alphanumeric strings of 20+ characters
  CONVEX_ID: /^[a-z0-9]{20,}$/i,

  // Crypto addresses - various formats
  CRYPTO_ADDRESS:
    /^(0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34}|[a-z0-9]{32,44})$/,

  // UUIDs
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  // Generic long IDs (fallback for other ID formats)
  LONG_ID: /^[a-z0-9\-_]{16,}$/i,
};

// Route configurations for special handling
const ROUTE_CONFIGS: Record<
  string,
  {
    redirectToList: boolean;
    queryParam: string;
  }
> = {
  addresses: {
    // When navigating from addresses/{id}/*, redirect to list with query param
    redirectToList: true,
    queryParam: "address",
  },
  // Add more route configs as needed
  // transactions: {
  //   redirectToList: true,
  //   queryParam: "tx",
  // },
};

// Format label based on segment type
function formatLabel(segment: string): string {
  // Check if it's any type of ID
  if (
    PATTERNS.CONVEX_ID.test(segment) ||
    PATTERNS.CRYPTO_ADDRESS.test(segment) ||
    PATTERNS.UUID.test(segment) ||
    PATTERNS.LONG_ID.test(segment)
  ) {
    // Truncate long IDs: show first 6 and last 4 characters
    if (segment.length > 10) {
      return `${segment.slice(0, 6)}...${segment.slice(-4)}`;
    }
    return segment;
  }

  // Regular text: capitalize first letter
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Check if a segment is any type of ID
function isIdentifier(segment: string): boolean {
  return (
    PATTERNS.CONVEX_ID.test(segment) ||
    PATTERNS.CRYPTO_ADDRESS.test(segment) ||
    PATTERNS.UUID.test(segment) ||
    PATTERNS.LONG_ID.test(segment)
  );
}

// Generate breadcrumb items from pathname
function generateBreadcrumbs(pathname: string) {
  // Remove leading slash and split by slash
  const segments = pathname.split("/").filter(Boolean);

  // Filter out route groups
  const cleanSegments = segments.filter(
    (segment) => !PATTERNS.ROUTE_GROUP.test(segment),
  );

  const breadcrumbs: Array<{
    label: string;
    href: string;
    isLast: boolean;
  }> = [];

  // Add breadcrumbs for each segment
  cleanSegments.forEach((segment, index) => {
    const isLast = index === cleanSegments.length - 1;
    const previousSegment = index > 0 ? cleanSegments[index - 1] : null;
    let href = `/${cleanSegments.slice(0, index + 1).join("/")}`;

    // Format the label
    const label = formatLabel(segment);

    // Check for special routing rules
    if (previousSegment && ROUTE_CONFIGS[previousSegment]) {
      const config = ROUTE_CONFIGS[previousSegment];

      // If this is an ID following a configured route and not the last segment
      // redirect to the list page with query parameter
      if (config.redirectToList && isIdentifier(segment) && !isLast) {
        href = `/${previousSegment}?${config.queryParam}=${segment}`;
      }
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
