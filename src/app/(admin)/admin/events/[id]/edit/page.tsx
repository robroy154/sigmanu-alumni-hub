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
  const admin   = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (event === null) notFound();

  // Load custom fields and their response counts
  const { data: fields } = await admin
    .from("event_fields")
    .select("id, event_id, field_label, field_type, field_options, required, display_order, created_at")
    .eq("event_id", id)
    .order("display_order");

  const fieldIds = (fields ?? []).map((f) => f.id);
  const responseCountByFieldId: Record<string, number> = {};

  if (fieldIds.length > 0) {
    const { data: responses } = await admin
      .from("event_field_responses")
      .select("field_id")
      .in("field_id", fieldIds);

    for (const r of responses ?? []) {
      responseCountByFieldId[r.field_id] =
        (responseCountByFieldId[r.field_id] ?? 0) + 1;
    }
  }

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
        <EventForm
          event={event}
          initialFields={fields ?? []}
          responseCountByFieldId={responseCountByFieldId}
        />
      </div>
    </div>
  );
}
