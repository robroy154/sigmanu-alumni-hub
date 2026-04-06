/**
 * Seed script — creates 50 demo member accounts for development.
 *
 * Run with:
 *   npx tsx scripts/seed-demo-members.ts
 *
 * Requires .env.local to be present with NEXT_PUBLIC_SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY.
 *
 * Safe to re-run: existing emails are skipped.
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.local
config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Member definitions
// ---------------------------------------------------------------------------
// big_ref uses the array index (0-based) of the member who is their big.
// null = root (no big).
//
// Tree structure produces:
//   Family A: 5 levels deep, nodes with 1/2/3 littles
//   Family B: 4 levels deep
//   Family C: 3 levels deep
//   Family D: 3 levels deep (separate root)
// ---------------------------------------------------------------------------

interface MemberDef {
  first_name:   string;
  last_name:    string;
  nickname:     string | null;
  pledge_class: string;
  pin_number:   string;
  city:         string | null;
  state:        string | null;
  big_ref:      number | null; // 0-based index into this array
}

const MEMBERS: MemberDef[] = [
  // ─── FAMILY A — Root ────────────────────────────────────────────── idx 0
  { first_name: "James",   last_name: "Hartwell",  nickname: "Jimmy",   pledge_class: "Alpha",   pin_number: "SN-001", city: "Columbus",    state: "GA", big_ref: null },

  // ─── Family A — Level 2 (big = idx 0) ────────────────────────── 1,2,3
  { first_name: "Marcus",  last_name: "Chen",      nickname: null,       pledge_class: "Beta",    pin_number: "SN-002", city: "Atlanta",     state: "GA", big_ref: 0 },
  { first_name: "Tyler",   last_name: "Brooks",    nickname: "T-Brooks", pledge_class: "Gamma",   pin_number: "SN-003", city: "Savannah",    state: "GA", big_ref: 0 },
  { first_name: "Derek",   last_name: "Nguyen",    nickname: null,       pledge_class: "Delta",   pin_number: "SN-004", city: null,          state: null, big_ref: 0 },

  // ─── Family A — Level 3 (big = Marcus idx 1) ─────────────────── 4,5
  { first_name: "Aaron",   last_name: "Patel",     nickname: "AP",       pledge_class: "Delta",   pin_number: "SN-005", city: "Columbus",    state: "GA", big_ref: 1 },
  { first_name: "Ryan",    last_name: "Kowalski",  nickname: null,       pledge_class: "Epsilon", pin_number: "SN-006", city: "Macon",       state: "GA", big_ref: 1 },

  // ─── Family A — Level 3 (big = Tyler idx 2) ─────────────────── 6,7
  { first_name: "Ethan",   last_name: "Murphy",    nickname: "Murph",    pledge_class: "Epsilon", pin_number: "SN-007", city: "Augusta",     state: "GA", big_ref: 2 },
  { first_name: "Devon",   last_name: "Wallace",   nickname: null,       pledge_class: "Zeta",    pin_number: "SN-008", city: null,          state: null, big_ref: 2 },

  // ─── Family A — Level 4 (big = Aaron idx 4) ─────────────────── 8,9,10
  { first_name: "Cameron", last_name: "Osei",      nickname: "Cam",      pledge_class: "Zeta",    pin_number: "SN-009", city: "Columbus",    state: "GA", big_ref: 4 },
  { first_name: "Logan",   last_name: "Fischer",   nickname: null,       pledge_class: "Eta",     pin_number: "SN-010", city: "Albany",      state: "GA", big_ref: 4 },
  { first_name: "Caleb",   last_name: "Moreno",    nickname: "CJ",       pledge_class: "Eta",     pin_number: "SN-011", city: "Valdosta",    state: "GA", big_ref: 4 },

  // ─── Family A — Level 4 (big = Ryan idx 5) ──────────────────── 11
  { first_name: "Brendan", last_name: "Ellis",     nickname: null,       pledge_class: "Theta",   pin_number: "SN-012", city: null,          state: null, big_ref: 5 },

  // ─── Family A — Level 4 (big = Ethan idx 6) ─────────────────── 12,13
  { first_name: "Xavier",  last_name: "Diaz",      nickname: "X",        pledge_class: "Theta",   pin_number: "SN-013", city: "Columbus",    state: "GA", big_ref: 6 },
  { first_name: "Nathan",  last_name: "Sutton",    nickname: null,       pledge_class: "Iota",    pin_number: "SN-014", city: "Athens",      state: "GA", big_ref: 6 },

  // ─── Family A — Level 4 (big = Devon idx 7) ─────────────────── 14
  { first_name: "Jordan",  last_name: "Pierce",    nickname: "JP",       pledge_class: "Iota",    pin_number: "SN-015", city: "Marietta",    state: "GA", big_ref: 7 },

  // ─── FAMILY B — Root ─────────────────────────────────────────── 15
  { first_name: "Connor",  last_name: "Blackwood", nickname: null,       pledge_class: "Alpha",   pin_number: "SN-016", city: "Columbus",    state: "GA", big_ref: null },

  // ─── FAMILY C — Root ─────────────────────────────────────────── 16
  { first_name: "Garrett", last_name: "Hayes",     nickname: "G-Man",    pledge_class: "Beta",    pin_number: "SN-017", city: "Columbus",    state: "GA", big_ref: null },

  // ─── Family A — Level 5 (big = Cameron idx 8) ───────────────── 17
  { first_name: "Spencer", last_name: "Yamamoto",  nickname: null,       pledge_class: "Kappa",   pin_number: "SN-018", city: "Columbus",    state: "GA", big_ref: 8 },

  // ─── Family A — Level 5 (big = Xavier idx 12) ───────────────── 18,19
  { first_name: "Miles",   last_name: "Crawford",  nickname: "Miles",    pledge_class: "Lambda",  pin_number: "SN-019", city: "Phenix City", state: "AL", big_ref: 12 },
  { first_name: "Zach",    last_name: "Olsen",     nickname: null,       pledge_class: "Lambda",  pin_number: "SN-020", city: "Columbus",    state: "GA", big_ref: 12 },

  // ─── Family A — Level 5 (big = Jordan idx 14) ───────────────── 20,21,22
  { first_name: "Tanner",  last_name: "Reid",      nickname: "Tank",     pledge_class: "Mu",      pin_number: "SN-021", city: null,          state: null, big_ref: 14 },
  { first_name: "Blake",   last_name: "Nguyen",    nickname: null,       pledge_class: "Mu",      pin_number: "SN-022", city: "Columbus",    state: "GA", big_ref: 14 },
  { first_name: "Austin",  last_name: "Coleman",   nickname: "AC",       pledge_class: "Nu",      pin_number: "SN-023", city: "LaGrange",    state: "GA", big_ref: 14 },

  // ─── Family B — Level 2 (big = Connor idx 15) ───────────────── 23,24
  { first_name: "Cody",    last_name: "Vance",     nickname: null,       pledge_class: "Beta",    pin_number: "SN-024", city: "Columbus",    state: "GA", big_ref: 15 },
  { first_name: "Drew",    last_name: "Holloway",  nickname: "Hollywood",pledge_class: "Beta",    pin_number: "SN-025", city: "Columbus",    state: "GA", big_ref: 15 },

  // ─── Family C — Level 2 (big = Garrett idx 16) ──────────────── 25,26,27
  { first_name: "Parker",  last_name: "Thompson",  nickname: null,       pledge_class: "Gamma",   pin_number: "SN-026", city: "Newnan",      state: "GA", big_ref: 16 },
  { first_name: "Chase",   last_name: "Whitfield", nickname: "Chase",    pledge_class: "Gamma",   pin_number: "SN-027", city: "Columbus",    state: "GA", big_ref: 16 },
  { first_name: "Mason",   last_name: "Burke",     nickname: null,       pledge_class: "Delta",   pin_number: "SN-028", city: "Dothan",      state: "AL", big_ref: 16 },

  // ─── FAMILY D — Root ─────────────────────────────────────────── 28
  { first_name: "Hunter",  last_name: "Simmons",   nickname: null,       pledge_class: "Alpha",   pin_number: "SN-029", city: "Columbus",    state: "GA", big_ref: null },

  // ─── Family A — Level 5 (big = Logan idx 9) ─────────────────── 29
  { first_name: "Jared",   last_name: "Tran",      nickname: "JT",       pledge_class: "Kappa",   pin_number: "SN-030", city: "Columbus",    state: "GA", big_ref: 9 },

  // ─── Family B — Level 3 (big = Cody idx 23) ─────────────────── 30,31,32
  { first_name: "Preston", last_name: "Carroll",   nickname: null,       pledge_class: "Gamma",   pin_number: "SN-031", city: "Columbus",    state: "GA", big_ref: 23 },
  { first_name: "Wyatt",   last_name: "Fleming",   nickname: "Wy",       pledge_class: "Gamma",   pin_number: "SN-032", city: "Columbus",    state: "GA", big_ref: 23 },
  { first_name: "Cole",    last_name: "Manning",   nickname: null,       pledge_class: "Eta",     pin_number: "SN-033", city: "Fort Benning",state: "GA", big_ref: 23 },

  // ─── Family B — Level 3 (big = Drew idx 24) ─────────────────── 33
  { first_name: "Trevor",  last_name: "Dunn",      nickname: null,       pledge_class: "Theta",   pin_number: "SN-034", city: "Columbus",    state: "GA", big_ref: 24 },

  // ─── Family C — Level 3 (big = Parker idx 25) ───────────────── 34,35
  { first_name: "Brady",   last_name: "Moss",      nickname: null,       pledge_class: "Theta",   pin_number: "SN-035", city: "Columbus",    state: "GA", big_ref: 25 },
  { first_name: "Colton",  last_name: "Adkins",    nickname: "Col",      pledge_class: "Iota",    pin_number: "SN-036", city: "Opelika",     state: "AL", big_ref: 25 },

  // ─── Family C — Level 3 (big = Chase idx 26) ────────────────── 36
  { first_name: "Nolan",   last_name: "Griffith",  nickname: null,       pledge_class: "Iota",    pin_number: "SN-037", city: "Columbus",    state: "GA", big_ref: 26 },

  // ─── Family C — Level 3 (big = Mason idx 27) ────────────────── 37,38
  { first_name: "Dillon",  last_name: "Shah",      nickname: "D",        pledge_class: "Kappa",   pin_number: "SN-038", city: null,          state: null, big_ref: 27 },
  { first_name: "Griffin", last_name: "Torres",    nickname: null,       pledge_class: "Kappa",   pin_number: "SN-039", city: "Columbus",    state: "GA", big_ref: 27 },

  // ─── Family B — Level 4 (big = Preston idx 30) ──────────────── 39,40
  { first_name: "Bennett", last_name: "Walsh",     nickname: "Ben",      pledge_class: "Eta",     pin_number: "SN-040", city: "Columbus",    state: "GA", big_ref: 30 },
  { first_name: "Landon",  last_name: "Cruz",      nickname: null,       pledge_class: "Theta",   pin_number: "SN-041", city: "Columbus",    state: "GA", big_ref: 30 },

  // ─── Family B — Level 4 (big = Trevor idx 33) ───────────────── 41
  { first_name: "Eli",     last_name: "Huang",     nickname: null,       pledge_class: "Iota",    pin_number: "SN-042", city: "Auburn",      state: "AL", big_ref: 33 },

  // ─── Family D — Level 2 (big = Hunter idx 28) ───────────────── 42,43
  { first_name: "Reid",    last_name: "McAllister", nickname: "Mack",    pledge_class: "Beta",    pin_number: "SN-043", city: "Columbus",    state: "GA", big_ref: 28 },
  { first_name: "Quinn",   last_name: "Patterson",  nickname: null,      pledge_class: "Gamma",   pin_number: "SN-044", city: "Columbus",    state: "GA", big_ref: 28 },

  // ─── Family A — Level 5 (big = Caleb idx 10) ────────────────── 44,45,46
  { first_name: "Seth",    last_name: "Gallagher",  nickname: null,      pledge_class: "Lambda",  pin_number: "SN-045", city: "Columbus",    state: "GA", big_ref: 10 },
  { first_name: "Brock",   last_name: "Hendricks",  nickname: "Hendo",   pledge_class: "Lambda",  pin_number: "SN-046", city: null,          state: null, big_ref: 10 },
  { first_name: "Owen",    last_name: "Castillo",   nickname: null,      pledge_class: "Mu",      pin_number: "SN-047", city: "Phenix City", state: "AL", big_ref: 10 },

  // ─── Family D — Level 3 (big = Reid idx 42) ─────────────────── 47,48
  { first_name: "Tristan", last_name: "Levy",       nickname: null,      pledge_class: "Delta",   pin_number: "SN-048", city: "Columbus",    state: "GA", big_ref: 42 },
  { first_name: "Brody",   last_name: "Kim",        nickname: "BK",      pledge_class: "Delta",   pin_number: "SN-049", city: "Columbus",    state: "GA", big_ref: 42 },

  // ─── Family D — Level 3 (big = Quinn idx 43) ────────────────── 49
  { first_name: "Sawyer",  last_name: "Lindqvist",  nickname: null,      pledge_class: "Epsilon", pin_number: "SN-050", city: "Columbus",    state: "GA", big_ref: 43 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nSeeding ${MEMBERS.length} demo members…\n`);

  // Step 1 — Create auth users + capture UUIDs
  const ids: (string | null)[] = new Array(MEMBERS.length).fill(null);

  for (let i = 0; i < MEMBERS.length; i++) {
    const m = MEMBERS[i];
    if (m === undefined) continue;
    const email = `demo.${m.first_name.toLowerCase()}.${m.last_name.toLowerCase()}@sigmanu-demo.internal`;

    // Check if user already exists in members table by email
    const { data: existing } = await supabase
      .from("members")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing !== null) {
      console.log(`  [skip] ${m.first_name} ${m.last_name} — already exists`);
      ids[i] = existing.id;
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password:      "DemoPass123!",
      email_confirm: true,
      user_metadata: { first_name: m.first_name, last_name: m.last_name },
    });

    if (error !== null || data.user === null) {
      console.error(`  [error] ${m.first_name} ${m.last_name}: ${error?.message}`);
      continue;
    }

    ids[i] = data.user.id;
    console.log(`  [+] ${m.first_name} ${m.last_name} (${data.user.id.slice(0, 8)}…)`);

    // Small delay to avoid rate-limiting
    await delay(80);
  }

  console.log("\nUpdating profiles…");

  // Step 2 — Update profile fields (no big_id yet — FK requires target to exist first)
  for (let i = 0; i < MEMBERS.length; i++) {
    const id = ids[i];
    if (id === null) continue;

    const m = MEMBERS[i];
    if (m === undefined) continue;

    const { error } = await supabase
      .from("members")
      .update({
        nickname:     m.nickname,
        pledge_class: m.pledge_class,
        pin_number:   m.pin_number,
        city:         m.city,
        state:        m.state,
        status:       "member",
      })
      .eq("id", id);

    if (error !== null) {
      console.error(`  [error] update ${m.first_name} ${m.last_name}: ${error.message}`);
    }
  }

  console.log("\nLinking big brothers…");

  // Step 3 — Set big_id relationships (all members exist now)
  for (let i = 0; i < MEMBERS.length; i++) {
    const id = ids[i];
    if (id === null) continue;

    const m = MEMBERS[i];
    if (m === undefined || m.big_ref === null) continue;

    const bigId = ids[m.big_ref];
    if (bigId === null) {
      console.warn(`  [warn] ${m.first_name} ${m.last_name} big not created — skipping`);
      continue;
    }

    const { error } = await supabase
      .from("members")
      .update({ big_id: bigId })
      .eq("id", id);

    if (error !== null) {
      console.error(`  [error] big link ${m.first_name} ${m.last_name}: ${error.message}`);
    } else {
      const big = MEMBERS[m.big_ref];
      console.log(`  ${m.first_name} ${m.last_name} → big: ${big?.first_name} ${big?.last_name}`);
    }
  }

  console.log("\nDone! 50 demo members seeded.\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
