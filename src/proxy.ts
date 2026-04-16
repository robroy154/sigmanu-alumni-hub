// event routing: no hardcoded event IDs or slugs in proxy redirect logic
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Route access matrix — ARCHITECTURE.md Section 4:
//
// Unauthenticated → / and auth routes only
// pending         → / + /register (Phase 5) + /pending-approval + auth routes
// member          → above + /directory + /family-tree + /profile
// admin           → everything above + /admin

const PUBLIC_ROUTES = ["/", "/auth/callback", "/auth/forgot-password", "/auth/reset-password", "/api/stripe", "/events", "/join"];
const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/pending-approval",
  "/complete-profile",
];
const PENDING_ALLOWED = ["/register", "/events", "/auth/claim-stub"];
const ADMIN_ROUTES = ["/admin", "/api/admin"];

function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Supabase SSR: create client here to keep the session cookie refreshed.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run any logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Server action requests carry a Next-Action header. Let them through
  // unconditionally — they have their own auth checks inside the action.
  if (request.headers.has("Next-Action")) {
    return supabaseResponse;
  }

  const isPublicRoute = matchesRoute(pathname, PUBLIC_ROUTES);
  const isAuthRoute = matchesRoute(pathname, AUTH_ROUTES);

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (user === null) {
    if (isPublicRoute || isAuthRoute) {
      return supabaseResponse;
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Authenticated: fetch member status (lightweight single-column query) ───
  const { data: member } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  const status = member?.status as string | undefined;

  // Authenticated users on auth pages → redirect away from login/signup
  if (isAuthRoute && pathname !== "/pending-approval" && pathname !== "/complete-profile") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Authenticated users on the public landing page → redirect to /home
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // ── Pending ────────────────────────────────────────────────────────────────
  if (status === "pending") {
    const pendingOk =
      isPublicRoute ||
      isAuthRoute ||
      matchesRoute(pathname, PENDING_ALLOWED);

    if (!pendingOk) {
      return NextResponse.redirect(new URL("/pending-approval", request.url));
    }
    return supabaseResponse;
  }

  // ── Stub ───────────────────────────────────────────────────────────────────
  // Stub rows have no valid session destination — redirect to pending-approval.
  if (status === "stub") {
    return NextResponse.redirect(new URL("/pending-approval", request.url));
  }

  // ── Member ─────────────────────────────────────────────────────────────────
  if (status === "member") {
    if (matchesRoute(pathname, ADMIN_ROUTES)) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return supabaseResponse;
  }

  // ── Admin ──────────────────────────────────────────────────────────────────
  // Admin has full access — including all member routes and admin routes.
  if (status === "admin") {
    return supabaseResponse;
  }

  // Unknown status: fail safe — redirect to pending-approval
  return NextResponse.redirect(new URL("/pending-approval", request.url));
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
