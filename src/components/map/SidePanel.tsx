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
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 25 }}
          className="pointer-events-auto absolute right-3 top-3 z-[1001] w-[min(92vw,360px)] rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{selectedDistrict}</p>
              <h3 className="text-lg font-semibold text-slate-900">{selectedConstituencyName}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected Year ({year})</p>
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Past Winners</p>
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
