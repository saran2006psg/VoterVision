import { getLegendEntries } from '@/lib/map/colors';

type LegendProps = {
  selectedParty: string | null;
  onToggleParty: (party: string) => void;
};

export function Legend({ selectedParty, onToggleParty }: LegendProps) {
  const entries = getLegendEntries();

  return (
    <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Winner Party</p>
      <ul className="space-y-1">
        {entries.map((entry) => {
          const isSelected = selectedParty === null || selectedParty === entry.party;
          return (
            <li 
              key={entry.party} 
              className={`flex cursor-pointer items-center gap-2 text-xs transition-opacity hover:opacity-80 ${isSelected ? 'text-slate-800 font-medium' : 'text-slate-400'}`}
              onClick={() => onToggleParty(entry.party)}
              title={`Click to filter by ${entry.party}`}
            >
              <span
                className={`h-3 w-3 rounded-sm border transition-colors ${isSelected ? 'border-slate-300' : 'border-slate-200'}`}
                style={{ backgroundColor: isSelected ? entry.color : '#e2e8f0' }}
              />
              <span>{entry.party}</span>
            </li>
          );
        })}
        {selectedParty && (
          <li 
            className="mt-2 text-[10px] text-emerald-600 underline cursor-pointer"
            onClick={() => onToggleParty(selectedParty)} /* this will toggle it off */
          >
            Clear Filter
          </li>
        )}
      </ul>
    </div>
  );
}
