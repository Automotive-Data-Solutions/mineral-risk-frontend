import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/api/webhooks/(.*)",
  "/intelligence(.*)",
]);

const hasClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY,
);

export default hasClerkConfigured
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next internals + static files unless invoked via API
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
};
