import Link from "next/link";

interface LineagePerson {
  id: string;
  first_name: string;
  last_name: string;
}

interface LineageTileProps {
  you: LineagePerson;
  big: LineagePerson | null;
  littles: LineagePerson[];
}

export function LineageTile({ you, big, littles }: LineageTileProps) {
  return (
    <div className="md:col-span-2 bg-sn-surface border border-white/8 rounded-2xl p-4.5 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sn-off-white font-semibold text-[12.5px]">Your Lineage</p>
        <Link href="/family-tree" className="text-sn-gold text-[11.5px] font-medium hover:text-sn-gold-light transition-colors">
          Open tree →
        </Link>
      </div>
      <div className="flex items-center gap-1.75">
        <LineageChip label="Big" name={big !== null ? `${big.first_name} ${big.last_name}` : "None yet"} />
        <span className="text-sn-gray-faint">→</span>
        <LineageChip label="You" name={`${you.first_name} ${you.last_name}`} highlight />
        <span className="text-sn-gray-faint">→</span>
        <LineageChip
          label={`Littles · ${littles.length}`}
          name={littles.length > 0 ? littles.map((l) => l.last_name).join(", ") : "None yet"}
        />
      </div>
    </div>
  );
}

function LineageChip({ label, name, highlight = false }: { label: string; name: string; highlight?: boolean }) {
  return (
    <div
      className={[
        "flex-1 min-w-0 rounded-[10px] px-2.75 py-2.5",
        highlight ? "bg-sn-gold/13 border border-sn-gold/35" : "bg-sn-surface-2",
      ].join(" ")}
    >
      <p className={`text-[9.5px] tracking-[0.12em] uppercase truncate ${highlight ? "text-sn-gold" : "text-sn-gray-medium"}`}>
        {label}
      </p>
      <p className={`text-[12px] font-medium truncate mt-0.75 ${highlight ? "text-sn-off-white" : "text-sn-text"}`}>
        {name}
      </p>
    </div>
  );
}
