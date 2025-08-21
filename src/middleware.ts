import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Define auth routes (sign-in and sign-up pages)
const isAuthRoute = createRouteMatcher(["/sign-in", "/sign-up"]);

export default convexAuthNextjsMiddleware(async (request) => {
  // Check if user is authenticated
  const isAuthenticated = await isAuthenticatedNextjs();

  // If user is on an auth page and is already authenticated,
  // redirect them to the dashboard or protected area
  if (isAuthRoute(request) && isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/");
  }

  // If the route is not public and user is not authenticated,
  // redirect them to the sign-in page
  if (!isAuthRoute(request) && !isAuthenticated) {
    return nextjsMiddlewareRedirect(request, "/sign-in");
  }

  // Allow the request to proceed
  return;
});

export const config = {
  // The following matcher runs middleware on all routes
  // except static assets.
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
