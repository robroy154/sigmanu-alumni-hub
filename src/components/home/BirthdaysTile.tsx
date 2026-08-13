import Link from "next/link";

interface BirthdayPerson {
  id: string;
  name: string;
  dateLabel: string;
}

export function BirthdaysTile({ people }: { people: BirthdayPerson[] }) {
  return (
    <div className="bg-sn-surface border border-white/8 rounded-2xl p-4.5 flex flex-col gap-2">
      <p className="text-sn-gray-medium text-[10.5px] font-semibold tracking-[0.14em] uppercase">
        Upcoming Birthdays
      </p>
      {people.length === 0 ? (
        <p className="text-sn-gray-medium text-[11.5px]">None this month</p>
      ) : (
        <div className="flex flex-col gap-1.75">
          {people.map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.id}`}
              className="group flex items-center justify-between gap-2"
            >
              <span className="text-sn-text text-[12px] font-medium truncate group-hover:text-sn-gold-light transition-colors">
                {p.name}
              </span>
              <span className="text-sn-gray-medium text-[11px] shrink-0">{p.dateLabel}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
