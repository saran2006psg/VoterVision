import type { WinnerRow } from '@/lib/map/types';
import { getMarginBand } from '@/lib/map/colors';

type MapTooltipProps = {
  winner: WinnerRow | null;
  constituencyName: string;
  district: string;
};

export function MapTooltip({ winner, constituencyName, district }: MapTooltipProps) {
  const marginBand = winner ? getMarginBand(winner.marginPercentage) : null;

  return (
    <div className="rounded-lg border border-slate-300 bg-white/98 p-3 shadow-lg backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{district}</p>
      <h3 className="mt-1 text-base font-bold text-slate-900">{constituencyName}</h3>
      {winner ? (
        <div className="mt-2 space-y-1 text-xs text-slate-700">
          <p>
            Winner: <span className="font-semibold">{winner.party}</span>
          </p>
          <p>
            Runner-up:{' '}
            <span className="font-semibold">{winner.runnerUpParty ?? 'N/A'}</span>
            {winner.runnerUpCandidateName ? ` (${winner.runnerUpCandidateName})` : ''}
          </p>
          <p>
            Vote Share: <span className="font-semibold">{winner.voteShare.toFixed(2)}%</span>
          </p>
          {winner.runnerUpVoteShare !== null ? (
            <p>
              Runner-up Share: <span className="font-semibold">{winner.runnerUpVoteShare.toFixed(2)}%</span>
            </p>
          ) : null}
          <p>
            Margin: <span className="font-semibold">{winner.margin.toLocaleString()}</span> votes ({winner.marginPercentage.toFixed(2)}%)
          </p>
          <p>
            Seat Type:{' '}
            <span className="font-semibold capitalize">
              {marginBand === 'safe' ? 'Safe' : marginBand === 'swing' ? 'Swing' : 'Lean'}
            </span>
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
