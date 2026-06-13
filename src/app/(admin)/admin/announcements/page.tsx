import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { AnnouncementControls } from "@/components/admin/AnnouncementControls";
import { EditAnnouncementForm } from "@/components/admin/EditAnnouncementForm";
import { Megaphone } from "lucide-react";

export const metadata: Metadata = { title: "Announcements — Admin" };

export default async function AdminAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmail = user?.email ?? "";

  const admin = createAdminClient();

  const { data: announcements } = await admin
    .from("announcements")
    .select("id, title, body, slug, is_active, is_pinned, show_on_login, created_at, updated_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  const rows = announcements ?? [];
  const active  = rows.filter((a) => a.is_active).length;
  const inactive = rows.length - active;

  return (
    <div className="space-y-8">
      <h1 className="text-sn-off-white text-2xl font-bold">Announcements</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total"    value={rows.length} color="text-sn-off-white" />
        <StatCard label="Active"   value={active}      color="text-green-400" />
        <StatCard label="Inactive" value={inactive}    color="text-sn-gray-medium" />
      </div>

      {/* Create form */}
      <div className="bg-sn-surface rounded-xl px-6 py-5">
        <h2 className="text-sn-off-white font-semibold mb-4">New Announcement</h2>
        <AnnouncementForm adminEmail={adminEmail} />
      </div>

      {/* List */}
      <div className="bg-sn-surface rounded-xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Megaphone className="size-8 text-sn-gray-medium" />
            <p className="text-sn-gray-text text-sm">No announcements posted.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {rows.map((a) => (
              <div key={a.id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sn-off-white font-medium text-sm truncate">{a.title}</p>
                    {a.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-green-400/10 border border-green-400/30 px-2 py-0.5 text-xs text-green-400 shrink-0">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/15 px-2 py-0.5 text-xs text-white/40 shrink-0">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sn-gray-text text-xs line-clamp-2">{a.body}</p>
                  <p className="text-sn-gray-medium text-xs mt-1 flex items-center gap-2">
                    <span>
                      {new Date(a.created_at).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </span>
                    {a.updated_at !== null && a.updated_at !== a.created_at && (
                      <span className="text-white/30">
                        · Edited {new Date(a.updated_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric",
                        })}
                      </span>
                    )}
                    {a.is_pinned && (
                      <span className="text-sn-gold text-[10px] font-semibold uppercase tracking-wide">Pinned</span>
                    )}
                  </p>
                  <EditAnnouncementForm
                    announcementId={a.id}
                    initialTitle={a.title}
                    initialBody={a.body}
                    initialSlug={a.slug ?? null}
                  />
                </div>
                <AnnouncementControls announcementId={a.id} slug={a.slug ?? null} isActive={a.is_active} isPinned={a.is_pinned} showOnLogin={a.show_on_login} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-sn-surface rounded-xl border border-sn-gold/20 px-5 py-4">
      <p className="text-sn-gray-text text-xs uppercase tracking-wider">{label}</p>
      <p className={`${color} text-3xl font-bold mt-1`}>{value}</p>
    </div>
  );
}
