import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { EventForm } from "@/components/admin/EventForm";

export const metadata: Metadata = { title: "Admin · Edit Event" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEditEventPage({ params }: Props) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (event === null) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/events"
          className="text-white/50 hover:text-white text-sm transition-colors"
        >
          ← Events
        </Link>
        <h1 className="text-white text-2xl font-bold">Edit Event</h1>
      </div>

      <div className="bg-sn-black rounded-xl border border-sn-gold/20 p-6">
        <EventForm event={event} />
      </div>
    </div>
  );
}
