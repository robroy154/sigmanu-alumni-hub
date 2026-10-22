import { PLEDGE_CLASSES } from "@/lib/utils/pledge-classes";
import type { TablesUpdate } from "@/types/supabase";

// Shared cleanup + validation for member profile fields. Plain module (not
// "use server") so it runs in server actions and in the client-side signup write.
//
// Why this exists: the Zod schemas only validate the fields the forms render
// errors for, so everything else used to go straight to the DB as typed. That is
// how an email address ended up in `country` and "Georgia"/"Ga"/"GA" all coexist.
// Tightening the client schemas would block submits with no visible message, so
// the rules live here and callers surface the returned error as a toast.
//
// Phone numbers are only sanity-checked, not reformatted: E.164 normalization is
// its own scoped backlog item (#4).

export interface ProfileFieldsInput {
  first_name?:     string | null | undefined;
  last_name?:      string | null | undefined;
  nickname?:       string | null | undefined;
  pledge_class?:   string | null | undefined;
  phone?:          string | null | undefined;
  street_address?: string | null | undefined;
  city?:           string | null | undefined;
  state?:          string | null | undefined;
  zip?:            string | null | undefined;
  country?:        string | null | undefined;
  birthday?:       string | null | undefined;
  linkedin_url?:   string | null | undefined;
}

type FieldKey = keyof ProfileFieldsInput;
export type NormalizedProfileFields = Partial<Record<FieldKey, string | null>>;

export interface NormalizeOptions {
  /**
   * true: drop fields that fail validation instead of returning an error. Used
   * right after account creation, where failing would strand a half-created
   * signup; the member can correct the value later from their profile.
   */
  dropInvalid?: boolean;
}

export const DEFAULT_COUNTRY = "USA";

const MAX_LENGTH: Record<FieldKey, number> = {
  first_name: 50, last_name: 50, nickname: 50, pledge_class: 40, phone: 25,
  street_address: 120, city: 60, state: 30, zip: 10, country: 56, birthday: 10,
  linkedin_url: 200,
};

const LABEL: Record<FieldKey, string> = {
  first_name: "First name", last_name: "Last name", nickname: "Nickname",
  pledge_class: "Pledge class", phone: "Phone", street_address: "Street address",
  city: "City", state: "State", zip: "ZIP code", country: "Country",
  birthday: "Birthday", linkedin_url: "LinkedIn URL",
};

// Lowercased, dots removed -> canonical value.
const US_ALIASES = new Set(["us", "usa", "united states", "united states of america"]);

const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI", minnesota: "MN",
  mississippi: "MS", missouri: "MO", montana: "MT", nebraska: "NE", nevada: "NV",
  "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK",
  oregon: "OR", pennsylvania: "PA", "puerto rico": "PR", "rhode island": "RI",
  "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX",
  utah: "UT", vermont: "VT", virginia: "VA", washington: "WA",
  "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};
const US_STATE_CODES = new Set(Object.values(US_STATES));

/** Dropdown options for US states, sorted by name. Labels are title-cased from the map keys. */
export const US_STATE_OPTIONS: ReadonlyArray<{ code: string; name: string }> = Object.entries(US_STATES)
  .map(([name, code]) => ({
    code,
    name: name.replace(/\b(\w)/g, (c) => c.toUpperCase()).replace(/\bOf\b/, "of"),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

/** True when the country value means the US (blank counts, matching the column default). */
export function isUSCountry(country: string | null | undefined): boolean {
  const c = (country ?? "").trim();
  return c === "" || canonicalCountry(c) === DEFAULT_COUNTRY;
}

const PLEDGE_CLASS_SET = new Set<string>(PLEDGE_CLASSES);
// Sigma Nu's founding year. The shared chapter account uses a founding-date birthday on
// purpose, so anything later than this can be real; anything earlier can't.
const MIN_BIRTH_YEAR = 1869;

/** Trim; empty string -> null; undefined stays undefined (field not submitted). */
function clean(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed === "" ? null : trimmed;
}

export function canonicalCountry(value: string): string {
  return US_ALIASES.has(value.toLowerCase().replace(/\./g, "").trim()) ? DEFAULT_COUNTRY : value;
}

/** Returns an error message for an invalid value, or null when it is acceptable. */
function validate(key: FieldKey, value: string, country: string): string | null {
  if (value.length > MAX_LENGTH[key]) {
    return `${LABEL[key]} is too long (max ${MAX_LENGTH[key]} characters).`;
  }
  const isUS = country === DEFAULT_COUNTRY;
  switch (key) {
    case "country":
      return /^[\p{L} .,'()-]{2,56}$/u.test(value)
        ? null
        : "Country should be a country name, like USA.";
    case "state":
      if (isUS) return US_STATE_CODES.has(value) ? null : "Use the two-letter state code, like GA.";
      return /^[\p{L} .'-]{2,30}$/u.test(value) ? null : "State or region doesn't look right.";
    case "zip":
      if (isUS) return /^\d{5}(-\d{4})?$/.test(value) ? null : "ZIP code should be 5 digits.";
      return /^[A-Za-z0-9 -]{2,10}$/.test(value) ? null : "Postal code doesn't look right.";
    case "phone": {
      const digits = value.replace(/\D/g, "").length;
      return /^[0-9()+.\- ]+$/.test(value) && digits >= 7 && digits <= 15
        ? null
        : "Phone number doesn't look right.";
    }
    case "birthday": {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Birthday doesn't look right.";
      const date = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return "Birthday doesn't look right.";
      }
      return date.getUTCFullYear() >= MIN_BIRTH_YEAR && date.getTime() <= Date.now()
        ? null
        : "Birthday doesn't look right.";
    }
    case "pledge_class":
      return PLEDGE_CLASS_SET.has(value) ? null : "Choose a pledge class from the list.";
    case "linkedin_url":
      return /^https:\/\/(www\.)?linkedin\.com\//.test(value) ? null : "Must be a LinkedIn URL.";
    default:
      return null;
  }
}

/**
 * Cleans and validates whichever profile fields are present on `input`.
 * Keys absent from `input` are absent from `values` (callers decide whether to
 * write them). Present-but-empty optional fields become null. `country` is
 * resolved first because state/ZIP rules depend on it; when no country is given
 * the member is treated as US-based, matching the column default.
 */
export function normalizeProfileFields(
  input: ProfileFieldsInput,
  options: NormalizeOptions = {},
): { values: NormalizedProfileFields; error: string | null } {
  const values: NormalizedProfileFields = {};

  const rawCountry = clean(input.country);
  const country = rawCountry ? canonicalCountry(rawCountry) : DEFAULT_COUNTRY;

  // Fixed order so "country" is validated before "state" and "zip".
  const keys: FieldKey[] = [
    "first_name", "last_name", "nickname", "pledge_class", "phone", "street_address",
    "city", "country", "state", "zip", "birthday", "linkedin_url",
  ];

  for (const key of keys) {
    if (!(key in input)) continue;
    let value = clean(input[key]);

    if ((key === "first_name" || key === "last_name") && !value) {
      if (options.dropInvalid) continue;
      return { values, error: `${LABEL[key]} is required.` };
    }
    if (value === undefined) continue;
    if (value === null) {
      values[key] = null;
      continue;
    }

    if (key === "country") value = canonicalCountry(value);
    if (key === "state" && country === DEFAULT_COUNTRY) {
      value = US_STATES[value.toLowerCase()] ?? value.toUpperCase();
    }

    const problem = validate(key, value, country);
    if (problem !== null) {
      if (options.dropInvalid) continue;
      return { values, error: problem };
    }
    values[key] = value;
  }

  return { values, error: null };
}

/**
 * Typed members update containing only fields that have a value. Used by the
 * signup and join paths, where a blank optional field means "not provided" and
 * must not overwrite anything (e.g. data copied from a claimed stub).
 */
export function nonEmptyMemberFields(values: NormalizedProfileFields): TablesUpdate<"members"> {
  const update: TablesUpdate<"members"> = {};
  for (const key of Object.keys(values) as FieldKey[]) {
    const value = values[key];
    if (value !== null && value !== undefined) update[key] = value;
  }
  return update;
}
