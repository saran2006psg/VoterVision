'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPartyColor } from '@/lib/map/colors';
import type { CandidateResult } from '@/lib/map/types';

type CandidatesModalProps = {
  open: boolean;
  constituencyName: string;
  constituencyId: number;
  year: number;
  onClose: () => void;
};

export function CandidatesModal({
  open,
  constituencyName,
  constituencyId,
  year,
  onClose,
}: CandidatesModalProps) {
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !constituencyId) return;

    const fetchCandidates = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/candidates?constituencyId=${constituencyId}&year=${year}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch candidates');
        }
        const data = await response.json();
        setCandidates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [open, constituencyId, year]);

  return (
    <AnimatePresence>
      {open ? (
        // Backdrop
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="pointer-events-auto fixed inset-0 z-[502] bg-black/30 backdrop-blur-sm"
        />
      ) : null}
      {open ? (
        // Modal
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto fixed left-1/2 top-1/2 z-[503] w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-lg border border-slate-300 bg-white/98 shadow-xl backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{constituencyName}</h2>
              <p className="mt-1 text-sm text-slate-600">All Candidates - Election {year}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              ← Back
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-500"></div>
                  <p className="mt-3 text-sm text-slate-600">Loading candidates...</p>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : candidates.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
                No candidate data available.
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate, index) => (
                  <div
                    key={`${candidate.position}-${candidate.party}-${index}`}
                    className="rounded-lg border border-slate-200 p-4 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        {/* Position Badge */}
                        <div
                          className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold text-white text-sm"
                          style={{
                            backgroundColor:
                              candidate.position === 1
                                ? '#22c55e'
                                : candidate.position <= 3
                                  ? '#f59e0b'
                                  : '#cbd5e1',
                          }}
                        >
                          {candidate.position}
                        </div>

                        {/* Candidate Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {candidate.candidateName}
                            </h3>
                            {candidate.position === 1 && (
                              <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                                Winner
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: getPartyColor(candidate.party) }}
                            />
                            <span className="text-sm text-slate-600">{candidate.party}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vote Stats */}
                      <div className="flex-shrink-0 text-right">
                        <div className="text-lg font-bold text-slate-900">
                          {candidate.voteShare.toFixed(2)}%
                        </div>
                        <div className="text-xs text-slate-600">
                          {candidate.votes.toLocaleString()} votes
                        </div>
                      </div>
                    </div>

                    {/* Vote Share Bar */}
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.min(candidate.voteShare, 100)}%`,
                          backgroundColor: getPartyColor(candidate.party),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Stats */}
          {!loading && candidates.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
              Total Candidates: <span className="font-semibold text-slate-900">{candidates.length}</span>
            </div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
