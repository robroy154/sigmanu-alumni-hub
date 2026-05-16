/**
 * Safe data cleanup script — removes test/demo members and orphaned events.
 *
 * Dry run (safe, no deletions):
 *   npx tsx scripts/cleanup-test-data.ts
 *
 * Execute deletions:
 *   npx tsx scripts/cleanup-test-data.ts --execute
 *
 * Protected and never deleted:
 *   - Any member who has a paid registration (payment_status = 'paid')
 *   - Any member with status = 'admin'
 *
 * Protected and never deleted (events):
 *   - Any event that has at least one paid registration
 *   - The event with the most total registrations (preserved as primary event)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EXECUTE = process.argv.includes("--execute");

// ── Helpers ───────────────────────────────────────────────────────────────────

function log(msg: string): void {
  console.log(msg);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (EXECUTE) {
    log("⚠️  EXECUTE mode — deletions will be performed.");
  } else {
    log("ℹ️  DRY RUN mode — nothing will be deleted. Pass --execute to apply.");
  }
  log("");

  // ── 1. Build the protected member set ──────────────────────────────────────

  // Members who have at least one paid registration.
  const { data: paidRegs, error: paidRegsErr } = await supabase
    .from("registrations")
    .select("member_id")
    .eq("payment_status", "paid")
    .not("member_id", "is", null);

  if (paidRegsErr !== null) {
    console.error("Failed to fetch paid registrations:", paidRegsErr.message);
    process.exit(1);
  }

  const paidMemberIds = new Set(
    (paidRegs ?? [])
      .map((r) => r.member_id as string | null)
      .filter((id): id is string => id !== null)
  );

  // All admins.
  const { data: admins, error: adminsErr } = await supabase
    .from("members")
    .select("id")
    .eq("status", "admin");

  if (adminsErr !== null) {
    console.error("Failed to fetch admins:", adminsErr.message);
    process.exit(1);
  }

  const adminIds = new Set((admins ?? []).map((a) => a.id as string));

  // Union: protected = paid registrants + admins.
  const protectedIds = new Set([...paidMemberIds, ...adminIds]);

  // ── 2. Fetch all members not in the protected set ──────────────────────────

  const { data: allMembers, error: membersErr } = await supabase
    .from("members")
    .select("id, email, first_name, last_name");

  if (membersErr !== null) {
    console.error("Failed to fetch members:", membersErr.message);
    process.exit(1);
  }

  const unprotectedMembers = (allMembers ?? []).filter(
    (m) => !protectedIds.has(m.id as string)
  );

  // ── 3. Process members ─────────────────────────────────────────────────────

  let membersDeleted  = 0;
  let membersSkipped  = 0;

  log(`── Members ──────────────────────────────────────────`);
  log(`   Total:     ${(allMembers ?? []).length}`);
  log(`   Protected: ${protectedIds.size}`);
  log(`   To remove: ${unprotectedMembers.length}`);
  log("");

  for (const member of unprotectedMembers) {
    const label = `${member.email} (${member.id})`;
    if (EXECUTE) {
      const { error } = await supabase.auth.admin.deleteUser(member.id as string);
      if (error !== null) {
        console.error(`  [ERROR] Could not delete ${label}: ${error.message}`);
      } else {
        log(`  [DELETED] ${label}`);
        membersDeleted++;
      }
    } else {
      log(`  [DRY RUN] Would delete: ${label}`);
      membersSkipped++;
    }
  }

  // ── 4. Build protected event set ───────────────────────────────────────────

  // Events with at least one paid registration.
  const { data: paidEventRegs, error: paidEventErr } = await supabase
    .from("registrations")
    .select("event_id")
    .eq("payment_status", "paid");

  if (paidEventErr !== null) {
    console.error("Failed to fetch paid event registrations:", paidEventErr.message);
    process.exit(1);
  }

  const eventsWithPaid = new Set(
    (paidEventRegs ?? []).map((r) => r.event_id as string)
  );

  // Event with the most total registrations — always preserved.
  const { data: allRegs, error: allRegsErr } = await supabase
    .from("registrations")
    .select("event_id");

  if (allRegsErr !== null) {
    console.error("Failed to fetch all registrations:", allRegsErr.message);
    process.exit(1);
  }

  const regCountByEvent: Record<string, number> = {};
  for (const r of allRegs ?? []) {
    const eid = r.event_id as string;
    regCountByEvent[eid] = (regCountByEvent[eid] ?? 0) + 1;
  }

  let primaryEventId: string | null = null;
  let primaryEventMax = -1;
  for (const [eid, count] of Object.entries(regCountByEvent)) {
    if (count > primaryEventMax) {
      primaryEventMax = count;
      primaryEventId  = eid;
    }
  }

  // ── 5. Fetch and process events ────────────────────────────────────────────

  const { data: allEvents, error: eventsErr } = await supabase
    .from("events")
    .select("id, title");

  if (eventsErr !== null) {
    console.error("Failed to fetch events:", eventsErr.message);
    process.exit(1);
  }

  const eventsToDelete = (allEvents ?? []).filter(
    (ev) =>
      !eventsWithPaid.has(ev.id as string) &&
      ev.id !== primaryEventId
  );

  let eventsDeleted = 0;
  let eventsSkippedDry = 0;

  log("");
  log(`── Events ───────────────────────────────────────────`);
  log(`   Total:     ${(allEvents ?? []).length}`);
  log(`   Protected: ${eventsWithPaid.size}${primaryEventId !== null ? " (+ primary event preserved)" : ""}`);
  log(`   To remove: ${eventsToDelete.length}`);
  log("");

  for (const ev of eventsToDelete) {
    const label = `${ev.title} (${ev.id})`;
    if (EXECUTE) {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", ev.id as string);
      if (error !== null) {
        console.error(`  [ERROR] Could not delete event ${label}: ${error.message}`);
      } else {
        log(`  [DELETED] event: ${label}`);
        eventsDeleted++;
      }
    } else {
      log(`  [DRY RUN] Would delete event: ${label}`);
      eventsSkippedDry++;
    }
  }

  // ── 6. Summary ─────────────────────────────────────────────────────────────

  log("");
  log("── Summary ──────────────────────────────────────────");
  if (EXECUTE) {
    log(`   Members deleted:  ${membersDeleted}`);
    log(`   Events deleted:   ${eventsDeleted}`);
    log(`   Protected:        ${protectedIds.size} members, ${eventsWithPaid.size} events`);
  } else {
    log(`   Would delete:     ${membersSkipped} members, ${eventsSkippedDry} events`);
    log(`   Protected:        ${protectedIds.size} members, ${eventsWithPaid.size} events`);
    log("");
    log("   Re-run with --execute to apply deletions.");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
