interface StatTileProps {
  eyebrow: string;
  numeral: string | number;
  caption: string;
}

export function StatTile({ eyebrow, numeral, caption }: StatTileProps) {
  return (
    <div className="bg-sn-surface border border-white/8 rounded-2xl p-4.5 flex flex-col gap-1.25">
      <p className="text-sn-gray-medium text-[10.5px] font-semibold tracking-[0.14em] uppercase">{eyebrow}</p>
      <p className="font-heading text-sn-off-white text-[28px] leading-[1.1]">{numeral}</p>
      <p className="text-sn-gray-medium text-[11.5px] truncate">{caption}</p>
    </div>
  );
}
