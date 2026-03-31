'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { WinnerRow } from '@/lib/map/types';

type SidePanelProps = {
  open: boolean;
  selectedConstituencyName: string;
  selectedDistrict: string;
  selectedWinner: WinnerRow | null;
  winnerHistory: WinnerRow[];
  year: number;
  onClose: () => void;
};

export function SidePanel({
  open,
  selectedConstituencyName,
  selectedDistrict,
  selectedWinner,
  winnerHistory,
  year,
  onClose,
}: SidePanelProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="pointer-events-auto absolute right-4 top-4 z-[501] w-[min(90vw,380px)] rounded-lg border border-slate-300 bg-white/98 p-4 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] font-medium text-slate-500">{selectedDistrict}</p>
              <h3 className="text-xl font-bold text-slate-900 mt-1">{selectedConstituencyName}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-600 mb-2\">Election {year}</p>
            {selectedWinner ? (
              <>
                <p className="text-sm text-slate-700">
                  Winner: <span className="font-semibold text-slate-900">{selectedWinner.party}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Candidate: <span className="font-semibold text-slate-900">{selectedWinner.candidateName}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Vote Share: <span className="font-semibold text-slate-900">{selectedWinner.voteShare.toFixed(2)}%</span>
                </p>
                <p className="text-sm text-slate-700">
                  Margin: <span className="font-semibold text-slate-900">{selectedWinner.margin.toLocaleString()}</span>
                </p>
                <p className="text-sm text-slate-700">
                  Turnout: <span className="font-semibold text-slate-900">{selectedWinner.turnoutPercentage.toFixed(2)}%</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">No winner data available for this year.</p>
            )}
          </div>

          <div className="mt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-600\">Historical Winners</p>
            <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {winnerHistory.length > 0 ? (
                winnerHistory.map((entry) => (
                  <li key={`${entry.acNo}-${entry.year}`} className="rounded-lg border border-slate-200 p-2 text-sm">
                    <p className="font-semibold text-slate-900">{entry.year}</p>
                    <p className="text-slate-700">{entry.party}</p>
                    <p className="text-xs text-slate-600">Vote Share: {entry.voteShare.toFixed(2)}%</p>
                  </li>
                ))
              ) : (
                <li className="rounded-lg border border-slate-200 p-2 text-sm text-slate-600">No history available.</li>
              )}
            </ul>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
