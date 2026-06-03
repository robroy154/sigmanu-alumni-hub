import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// OAuth callback — exchanges the one-time code for a session.
// Supabase redirects here after the user completes the OAuth provider flow.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Guard against open redirect: next must be a relative path.
  const rawNext = searchParams.get("next") ?? "/home";
  const next = rawNext.startsWith("/") ? rawNext : "/home";

  if (code === null) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError !== null) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // For auth-flow continuations (e.g. password reset), skip member status checks
  // and redirect immediately — the destination page handles its own requirements.
  if (next.startsWith("/auth/")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: member } = await supabase
    .from("members")
    .select("status, first_name, pledge_class")
    .eq("id", user.id)
    .single();

  // OAuth users: the handle_new_user trigger stores '' for first_name when the
  // provider doesn't supply it. Send them to the profile completion screen.
  if (member?.first_name === "" || member?.first_name === null) {
    return NextResponse.redirect(`${origin}/complete-profile`);
  }

  // Stub claim: only check for members who have no chapter data yet (pledge_class === null).
  // Members who already claimed a stub or filled in their profile are skipped — this
  // prevents re-prompting on every subsequent login.
  if (member?.pledge_class === null) {
    try {
      const meta = user.user_metadata as Record<string, string | undefined>;
      const firstName =
        meta.given_name ??
        (meta.full_name !== undefined ? meta.full_name.split(" ")[0] : undefined) ??
        (member.first_name !== "" ? member.first_name : undefined) ??
        "";
      const lastName =
        meta.family_name ??
        (meta.full_name !== undefined
          ? meta.full_name.split(" ").slice(1).join(" ")
          : undefined) ??
        "";

      if (firstName !== "" && lastName !== "") {
        const adminDb = createAdminClient();
        const { data: stubs } = await adminDb.rpc("search_stubs", {
          search_name: `${firstName} ${lastName}`,
        });

        const topMatch = (
          stubs as Array<{ id: string; similarity: number }> | null
        )?.[0];

        if (topMatch !== undefined && topMatch.similarity > 0.7) {
          return NextResponse.redirect(
            `${origin}/auth/claim-stub?suggested=${topMatch.id}&next=${encodeURIComponent(next)}`
          );
        }
      }
    } catch {
      // Non-blocking — any error falls through to normal redirect
    }
  }

  if (member?.status === "pending") {
    return NextResponse.redirect(`${origin}/pending-approval`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
