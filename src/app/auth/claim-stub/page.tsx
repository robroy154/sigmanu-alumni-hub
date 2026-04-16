import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClaimStubButton } from "./ClaimStubButton";

export const metadata: Metadata = { title: "Claim Your Record" };

interface Props {
  searchParams: Promise<{ suggested?: string; next?: string }>;
}

export default async function ClaimStubPage({ searchParams }: Props) {
  const { suggested, next: rawNext } = await searchParams;
  const destination = rawNext !== undefined ? decodeURIComponent(rawNext) : "/home";

  // Require authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user === null) redirect("/login");

  // Validate suggested stub ID
  if (suggested === undefined || suggested === "") redirect(destination);

  // Fetch the stub record
  const admin = createAdminClient();
  const { data: stub } = await admin
    .from("members")
    .select("id, first_name, last_name, nickname, pledge_class, pin_number, status")
    .eq("id", suggested)
    .single();

  // If not found or already claimed, skip ahead
  if (stub === null || stub.status !== "stub") redirect(destination);

  return (
    <Card className="w-full max-w-md bg-white/5 border-sn-gold/20">
      <CardHeader>
        <CardTitle className="text-white text-2xl">
          We found a record that might be yours
        </CardTitle>
        <CardDescription className="text-white/60">
          Select your record to carry over your chapter information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stub card */}
        <div className="bg-sn-surface rounded-sm border border-white/10 px-4 py-3 space-y-0.5">
          <p className="text-sn-off-white font-semibold text-sm">
            {stub.first_name} {stub.last_name}
          </p>
          {stub.nickname !== null && stub.nickname !== "" && (
            <p className="text-sn-gray-text text-xs">&ldquo;{stub.nickname}&rdquo;</p>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {stub.pledge_class !== null && stub.pledge_class !== "" && (
              <p className="text-sn-gray-text text-xs uppercase tracking-wide">
                {stub.pledge_class}
              </p>
            )}
            {stub.pin_number !== null && stub.pin_number !== "" && (
              <p className="text-sn-gold text-xs">Badge #{stub.pin_number}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <ClaimStubButton stubId={stub.id} next={destination} />
          <a
            href={destination}
            className="text-center text-white/60 hover:text-white text-sm transition-colors"
          >
            No, that&apos;s not me &rarr;
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
