import type { WinnerRow } from '@/lib/map/types';

type MapTooltipProps = {
  winner: WinnerRow | null;
  constituencyName: string;
  district: string;
};

export function MapTooltip({ winner, constituencyName, district }: MapTooltipProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{district}</p>
      <h3 className="text-sm font-semibold text-slate-900">{constituencyName}</h3>
      {winner ? (
        <div className="mt-2 space-y-1 text-xs text-slate-700">
          <p>
            Winner: <span className="font-semibold">{winner.party}</span>
          </p>
          <p>
            Vote Share: <span className="font-semibold">{winner.voteShare.toFixed(2)}%</span>
          </p>
          <p>
            Margin: <span className="font-semibold">{winner.margin.toLocaleString()}</span> ({winner.marginPercentage.toFixed(2)}%)
          </p>
          <p>
            Turnout: <span className="font-semibold">{winner.turnoutPercentage.toFixed(2)}%</span>
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-600">No winner data available for selected year.</p>
      )}
    </div>
  );
}
