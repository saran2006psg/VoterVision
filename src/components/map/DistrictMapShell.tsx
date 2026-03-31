'use client';

import dynamic from 'next/dynamic';
import type { MapPayload } from '@/lib/map/types';

const DistrictMap = dynamic(
  () => import('@/components/map/DistrictMap').then((module) => module.DistrictMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 animate-pulse">
        <div className="text-center space-y-3">
          <div className="inline-block px-8 py-3 bg-slate-200 rounded-lg"></div>
          <p className="text-slate-500 text-sm">Loading Tamil Nadu map...</p>
        </div>
      </div>
    ),
  },
);

type DistrictMapShellProps = Pick<
  MapPayload,
  'featureCollection' | 'winnersByYear' | 'winnerHistoryByAc' | 'availableYears' | 'initialYear'
>;

export function DistrictMapShell(props: DistrictMapShellProps) {
  return (
    <div className="h-full w-full">
      <DistrictMap {...props} />
    </div>
  );
}
