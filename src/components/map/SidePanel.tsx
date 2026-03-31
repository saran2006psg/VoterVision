'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getMarginBand } from '@/lib/map/colors';
import type { WinnerRow } from '@/lib/map/types';

type SidePanelProps = {
  open: boolean;
  selectedConstituencyName: string;
  selectedDistrict: string;
  selectedWinner: WinnerRow | null;
  winnerHistory: WinnerRow[];
  year: number;
  constituencyId: number;
  onClose: () => void;
  onViewCandidates: () => void;
};

export function SidePanel({
  open,
  selectedConstituencyName,
  selectedDistrict,
  selectedWinner,
  winnerHistory,
  year,
  constituencyId,
  onClose,
  onViewCandidates,
}: SidePanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const marginBand = selectedWinner ? getMarginBand(selectedWinner.marginPercentage) : null;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateIsMobile = () => setIsMobile(mediaQuery.matches);

    updateIsMobile();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateIsMobile);
      return () => mediaQuery.removeEventListener('change', updateIsMobile);
    }

    mediaQuery.addListener(updateIsMobile);
    return () => mediaQuery.removeListener(updateIsMobile);
  }, []);

  return (
    <AnimatePresence>
      {open ? (
        <>
          {isMobile ? (
            <motion.button
              type="button"
              aria-label="Close details"
              onClick={onClose}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-auto fixed inset-0 z-500 bg-black/20"
            />
          ) : null}

          <motion.aside
            initial={isMobile ? { y: 420, opacity: 0 } : { x: 360, opacity: 0 }}
            animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
            exit={isMobile ? { y: 420, opacity: 0 } : { x: 360, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className={
              isMobile
                ? 'pointer-events-auto fixed bottom-0 left-0 right-0 z-501 max-h-[78vh] rounded-t-2xl border border-slate-300 bg-white/98 px-4 pb-4 pt-2 shadow-2xl backdrop-blur-sm'
                : 'pointer-events-auto absolute right-4 top-4 z-501 w-[min(90vw,380px)] rounded-lg border border-slate-300 bg-white/98 p-4 shadow-xl backdrop-blur-sm'
            }
          >
            {isMobile ? <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300" /> : null}

            <div className={isMobile ? 'max-h-[68vh] overflow-y-auto pr-1' : ''}>
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-widest text-slate-500">{selectedDistrict}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 wrap-break-word">{selectedConstituencyName}</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 whitespace-nowrap rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-600">Election {year}</p>
                {selectedWinner ? (
                  <>
                    <p className="text-sm text-slate-700">
                      Winner: <span className="font-semibold text-slate-900">{selectedWinner.party}</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Candidate: <span className="font-semibold text-slate-900">{selectedWinner.candidateName}</span>
                    </p>
                    <div className="rounded-md border border-slate-200 bg-white p-2">
                      <p className="text-sm text-slate-700">
                        Runner-up: <span className="font-semibold text-slate-900">{selectedWinner.runnerUpParty ?? 'N/A'}</span>
                      </p>
                      {selectedWinner.runnerUpCandidateName ? (
                        <p className="text-sm text-slate-700">
                          Runner-up Candidate:{' '}
                          <span className="font-semibold text-slate-900">{selectedWinner.runnerUpCandidateName}</span>
                        </p>
                      ) : null}
                      {selectedWinner.runnerUpVoteShare !== null ? (
                        <p className="text-sm text-slate-700">
                          Runner-up Share:{' '}
                          <span className="font-semibold text-slate-900">{selectedWinner.runnerUpVoteShare.toFixed(2)}%</span>
                        </p>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-700">
                      Vote Share: <span className="font-semibold text-slate-900">{selectedWinner.voteShare.toFixed(2)}%</span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Margin: <span className="font-semibold text-slate-900">{selectedWinner.margin.toLocaleString()}</span> votes ({selectedWinner.marginPercentage.toFixed(2)}%)
                    </p>
                    <p className="text-sm text-slate-700">
                      Seat Type:{' '}
                      <span className="font-semibold capitalize text-slate-900">
                        {marginBand === 'safe' ? 'Safe' : marginBand === 'swing' ? 'Swing' : 'Lean'}
                      </span>
                    </p>
                    <p className="text-sm text-slate-700">
                      Turnout: <span className="font-semibold text-slate-900">{selectedWinner.turnoutPercentage.toFixed(2)}%</span>
                    </p>

                    <button
                      type="button"
                      onClick={onViewCandidates}
                      className="mt-4 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      View All Candidates
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-slate-600">No winner data available for this year.</p>
                )}
              </div>

              <div className="mt-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-600">Historical Winners</p>
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
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
