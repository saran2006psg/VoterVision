import { getLegendEntries } from '@/lib/map/colors';

export function Legend() {
  const entries = getLegendEntries();

  return (
    <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Winner Party</p>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.party} className="flex items-center gap-2 text-xs text-slate-700">
            <span
              className="h-3 w-3 rounded-sm border border-slate-300"
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.party}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
