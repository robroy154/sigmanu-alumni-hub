import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// OAuth callback — exchanges the one-time code for a session.
// Supabase redirects here after the user completes the OAuth provider flow.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/directory";

  if (code === null) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError !== null) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: member } = await supabase
    .from("members")
    .select("status, first_name")
    .eq("id", user.id)
    .single();

  // OAuth users: the handle_new_user trigger stores '' for first_name when the
  // provider doesn't supply it. Send them to the profile completion screen.
  if (member?.first_name === "" || member?.first_name === null) {
    return NextResponse.redirect(`${origin}/complete-profile`);
  }

  if (member?.status === "pending") {
    return NextResponse.redirect(`${origin}/pending-approval`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
