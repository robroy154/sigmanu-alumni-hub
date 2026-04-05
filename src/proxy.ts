import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Route access matrix — ARCHITECTURE.md Section 4:
//
// Unauthenticated → / (public event landing) only
// pending         → / and /register only
// member          → / + /directory + /family-tree + /profile
// admin           → everything above + /admin

const PUBLIC_ROUTES = ["/"];
const AUTH_ROUTES = ["/login", "/signup", "/pending-approval"];

// Member status enforcement is a Phase 3 stub.
// In Phase 3: fetch the member row from Supabase, read status,
// and redirect pending users to /pending-approval or /register,
// and unauthenticated users away from member/admin routes.

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Supabase SSR requires creating a client in proxy to keep
  // the session cookie refreshed on every request.
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

  // IMPORTANT: Do not run any logic between createServerClient and
  // getUser(). A stale session causes auth/session_not_found errors.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Unauthenticated users — redirect to /login except for public and auth pages
  if (!user && !isPublicRoute && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users hitting auth pages — send them home
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Phase 3: Add member status checks here.
  // Query: const { data: member } = await supabase.from("members").select("status").eq("id", user.id).single();
  // Then enforce: pending → /pending-approval, admin routes → require status === "admin"

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Match all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
