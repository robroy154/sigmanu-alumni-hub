import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: NextRequest) {
  // Verify caller is admin.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user === null) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from("members")
    .select("status")
    .eq("id", user.id)
    .single();

  if (caller?.status !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: registrations } = await admin
    .from("registrations")
    .select(
      "registrant_name, email, phone, tshirt_size, dietary_restrictions, guest_count, payment_status, stripe_payment_id, submitted_at, events(title, ticket_price), registration_guests(guest_name)"
    )
    .order("submitted_at", { ascending: false });

  if (registrations === null) {
    return NextResponse.json({ error: "Failed to fetch registrations." }, { status: 500 });
  }

  const escape = (val: string | null | undefined): string => {
    if (val === null || val === undefined) return "";
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    "Name",
    "Email",
    "Phone",
    "T-Shirt Size",
    "Dietary Restrictions",
    "Guest Count",
    "Guest Names",
    "Event",
    "Ticket Price",
    "Total Amount",
    "Payment Status",
    "Stripe Payment ID",
    "Submitted At",
  ];

  const rows = registrations.map((r) => {
    const price = Array.isArray(r.events)
      ? (r.events[0]?.ticket_price ?? 0)
      : ((r.events as { ticket_price: number } | null)?.ticket_price ?? 0);
    const eventTitle = Array.isArray(r.events)
      ? (r.events[0]?.title ?? "")
      : ((r.events as { title: string } | null)?.title ?? "");
    const guestNames = Array.isArray(r.registration_guests)
      ? r.registration_guests.map((g: { guest_name: string }) => g.guest_name).join("; ")
      : "";
    const total = (1 + (r.guest_count ?? 0)) * price;

    return [
      r.registrant_name,
      r.email,
      r.phone,
      r.tshirt_size,
      r.dietary_restrictions,
      r.guest_count ?? 0,
      guestNames,
      eventTitle,
      price > 0 ? `$${price.toFixed(2)}` : "Free",
      price > 0 ? `$${total.toFixed(2)}` : "Free",
      r.payment_status,
      r.stripe_payment_id,
      new Date(r.submitted_at).toLocaleString("en-US"),
    ]
      .map((v) => escape(v !== null && v !== undefined ? String(v) : ""))
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `registrations-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
