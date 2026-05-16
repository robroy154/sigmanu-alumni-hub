"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { importStubs, deleteAllStubs, type ImportRow } from "@/lib/admin/import-actions";

type ImportState =
  | { phase: "idle" }
  | { phase: "preview"; rows: ImportRow[]; filename: string }
  | { phase: "importing" }
  | { phase: "done"; inserted: number; skipped: number; errors: string[] };

const EXPECTED_COLUMNS = [
  "first_name",
  "last_name",
  "nickname",
  "pledge_class",
  "pin_number",
  "big_brother_name",
] as const;

function normalizeRow(raw: Record<string, string>): ImportRow | null {
  const firstName = (raw["first_name"] ?? "").trim();
  const lastName  = (raw["last_name"]  ?? "").trim();
  if (firstName === "" || lastName === "") return null;

  return {
    first_name:        firstName,
    last_name:         lastName,
    nickname:          (raw["nickname"]         ?? "").trim() || undefined,
    pledge_class:      (raw["pledge_class"]      ?? "").trim() || undefined,
    pin_number:        (raw["pin_number"]        ?? "").trim() || undefined,
    big_brother_name:  (raw["big_brother_name"]  ?? "").trim() || undefined,
  };
}

function downloadTemplate() {
  const header = EXPECTED_COLUMNS.join(",");
  const exampleRow = "John,Smith,Smitty,Alpha Beta,42,Robert Johnson";
  const csv = `${header}\n${exampleRow}\n`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "alumni-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  initialStubCount: number;
}

export default function ImportClient({ initialStubCount }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ImportState>({ phase: "idle" });
  const [deleteState, setDeleteState] = useState<
    | { phase: "idle" }
    | { phase: "confirming" }
    | { phase: "deleting" }
    | { phase: "done"; deleted: number }
    | { phase: "error"; message: string }
  >({ phase: "idle" });
  const [stubCount, setStubCount] = useState(initialStubCount);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file === undefined) return;

    Papa.parse<Record<string, string>>(file, {
      header:         true,
      skipEmptyLines: true,
      complete(results) {
        const rows: ImportRow[] = [];
        for (const raw of results.data) {
          const normalized = normalizeRow(raw);
          if (normalized !== null) rows.push(normalized);
        }
        setState({ phase: "preview", rows, filename: file.name });
      },
    });
  }

  async function handleImport() {
    if (state.phase !== "preview") return;
    const { rows } = state;
    setState({ phase: "importing" });

    const result = await importStubs(rows);
    setState({ phase: "done", ...result });
    setStubCount((c) => c + result.inserted);
  }

  function reset() {
    setState({ phase: "idle" });
    if (fileInputRef.current !== null) fileInputRef.current.value = "";
  }

  async function handleDeleteAll() {
    setDeleteState({ phase: "deleting" });
    const result = await deleteAllStubs();
    if (result.error !== undefined) {
      setDeleteState({ phase: "error", message: result.error });
    } else {
      setDeleteState({ phase: "done", deleted: result.deleted });
      setStubCount(0);
      reset();
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white text-2xl font-bold">Import Alumni Records</h1>
          <p className="text-white/50 text-sm mt-1">
            Upload a CSV file to pre-populate the member directory with alumni stubs.
            Imported records appear in the family tree as &ldquo;Unclaimed&rdquo; and can be
            claimed during signup.
          </p>
        </div>
        <div className="bg-sn-surface border border-sn-gold/20 rounded-xl px-5 py-3 text-center shrink-0">
          <p className="text-sn-gray-text text-xs uppercase tracking-wider">Unclaimed Stubs</p>
          <p className="text-sn-off-white text-2xl font-bold mt-0.5">{stubCount}</p>
        </div>
      </div>

      {/* ── CSV format reference ──────────────────────────────────────────── */}
      <div className="bg-sn-surface rounded-sm border border-white/10 p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            Expected CSV Format
          </h2>
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-sn-gold hover:text-sn-gold-light text-xs transition-colors border border-sn-gold/30 rounded-sm px-2.5 py-1"
          >
            Download template ↓
          </button>
        </div>
        <p className="text-white/50 text-sm">
          All columns except <span className="text-white/80">first_name</span> and{" "}
          <span className="text-white/80">last_name</span> are optional. Leave cells empty to
          import as null.
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs text-white/70 w-full">
            <thead>
              <tr className="border-b border-white/10">
                {EXPECTED_COLUMNS.map((col) => (
                  <th key={col} className="text-left py-1.5 pr-4 font-mono text-sn-gold/80">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-1.5 pr-4 font-mono">John</td>
                <td className="py-1.5 pr-4 font-mono">Smith</td>
                <td className="py-1.5 pr-4 font-mono">Smitty</td>
                <td className="py-1.5 pr-4 font-mono">Alpha Beta</td>
                <td className="py-1.5 pr-4 font-mono">42</td>
                <td className="py-1.5 pr-4 font-mono">Robert Johnson</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-4 font-mono">Jane</td>
                <td className="py-1.5 pr-4 font-mono">Doe</td>
                <td className="py-1.5 pr-4 font-mono text-white/30">(empty)</td>
                <td className="py-1.5 pr-4 font-mono">Beta Gamma</td>
                <td className="py-1.5 pr-4 font-mono text-white/30">(empty)</td>
                <td className="py-1.5 pr-4 font-mono text-white/30">(empty)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-white/40 text-xs">
          Duplicate detection: a row is skipped if a member with the same first name, last name,
          and pledge class already exists (any status). Different pledge classes with the same
          name will both be imported.
        </p>
      </div>

      {/* ── File picker ──────────────────────────────────────────────────── */}
      {(state.phase === "idle" || state.phase === "preview") && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-white/80 text-sm block mb-1.5">CSV file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block text-sm text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-white/20 file:text-xs file:font-medium file:text-white/80 file:bg-white/5 file:cursor-pointer hover:file:bg-white/10 transition-colors"
            />
          </label>
        </div>
      )}

      {/* ── Preview table ─────────────────────────────────────────────────── */}
      {state.phase === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white/70 text-sm">
              <span className="text-white font-semibold">{state.rows.length}</span> rows parsed
              from <span className="text-white/50 font-mono text-xs">{state.filename}</span>
            </p>
            <button
              type="button"
              onClick={reset}
              className="text-white/40 hover:text-white text-xs transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="overflow-x-auto rounded-sm border border-white/10">
            <table className="text-xs text-white/70 w-full">
              <thead className="bg-white/5">
                <tr>
                  {EXPECTED_COLUMNS.map((col) => (
                    <th key={col} className="text-left px-3 py-2 font-semibold text-white/50 uppercase tracking-wide text-[10px]">
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-3 py-2">{row.first_name}</td>
                    <td className="px-3 py-2">{row.last_name}</td>
                    <td className="px-3 py-2 text-white/40">{row.nickname ?? ""}</td>
                    <td className="px-3 py-2">{row.pledge_class ?? ""}</td>
                    <td className="px-3 py-2">{row.pin_number ?? ""}</td>
                    <td className="px-3 py-2 text-white/40">{row.big_brother_name ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {state.rows.length > 10 && (
            <p className="text-white/40 text-xs text-center">
              …and {state.rows.length - 10} more row{state.rows.length - 10 !== 1 ? "s" : ""}
            </p>
          )}

          <Button
            onClick={() => void handleImport()}
            className="bg-sn-gold text-sn-black hover:bg-sn-gold-light font-semibold"
          >
            Import {state.rows.length} record{state.rows.length !== 1 ? "s" : ""}
          </Button>
        </div>
      )}

      {/* ── Importing spinner ─────────────────────────────────────────────── */}
      {state.phase === "importing" && (
        <div className="flex items-center gap-3 text-white/60 text-sm py-4">
          <div className="w-4 h-4 border-2 border-sn-gold/40 border-t-sn-gold rounded-full animate-spin" />
          Importing records…
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────────────── */}
      {state.phase === "done" && (
        <div className="space-y-4">
          <div className="bg-sn-surface rounded-sm border border-white/10 p-5 space-y-3">
            <h2 className="text-white/70 text-xs font-semibold uppercase tracking-wider">
              Import Complete
            </h2>
            <div className="flex gap-6">
              <div>
                <p className="text-2xl font-bold text-green-400">{state.inserted}</p>
                <p className="text-white/50 text-xs">inserted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white/40">{state.skipped}</p>
                <p className="text-white/50 text-xs">skipped (duplicates)</p>
              </div>
              {state.errors.length > 0 && (
                <div>
                  <p className="text-2xl font-bold text-amber-400">{state.errors.length}</p>
                  <p className="text-white/50 text-xs">warning{state.errors.length !== 1 ? "s" : ""}</p>
                </div>
              )}
            </div>

            {state.errors.length > 0 && (
              <div className="space-y-1 pt-1">
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide">
                  Warnings
                </p>
                {state.errors.map((err, i) => (
                  <p key={i} className="text-white/50 text-xs">{err}</p>
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            onClick={reset}
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
          >
            Import another file
          </Button>
        </div>
      )}

      {/* ── Danger zone: delete all stubs ────────────────────────────────── */}
      <div className="border border-red-900/40 rounded-sm p-5 space-y-3">
        <h2 className="text-red-400/80 text-xs font-semibold uppercase tracking-wider">
          Danger Zone
        </h2>
        <p className="text-white/50 text-sm">
          Delete every stub record. Use this to wipe a bad import and start fresh.
          Members who have already claimed a stub are unaffected.
        </p>

        {deleteState.phase === "idle" && (
          <Button
            variant="destructive"
            onClick={() => setDeleteState({ phase: "confirming" })}
          >
            Delete all stubs
          </Button>
        )}

        {deleteState.phase === "confirming" && (
          <div className="flex items-center gap-3">
            <p className="text-red-300 text-sm font-medium">
              This cannot be undone. Delete all stub records?
            </p>
            <Button
              variant="destructive"
              onClick={() => void handleDeleteAll()}
            >
              Yes, delete all
            </Button>
            <button
              type="button"
              onClick={() => setDeleteState({ phase: "idle" })}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {deleteState.phase === "deleting" && (
          <div className="flex items-center gap-3 text-white/60 text-sm">
            <div className="w-4 h-4 border-2 border-red-500/40 border-t-red-500 rounded-full animate-spin" />
            Deleting stubs…
          </div>
        )}

        {deleteState.phase === "done" && (
          <div className="flex items-center gap-3">
            <p className="text-green-400 text-sm">
              Deleted {deleteState.deleted} stub{deleteState.deleted !== 1 ? "s" : ""}.
            </p>
            <button
              type="button"
              onClick={() => setDeleteState({ phase: "idle" })}
              className="text-white/40 hover:text-white text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {deleteState.phase === "error" && (
          <div className="flex items-center gap-3">
            <p className="text-red-400 text-sm">Error: {deleteState.message}</p>
            <button
              type="button"
              onClick={() => setDeleteState({ phase: "idle" })}
              className="text-white/40 hover:text-white text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
