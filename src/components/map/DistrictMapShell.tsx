'use client';

import dynamic from 'next/dynamic';
import type { MapPayload } from '@/lib/map/types';

const DistrictMap = dynamic(
  () => import('@/components/map/DistrictMap').then((module) => module.DistrictMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] animate-pulse rounded-3xl border border-slate-200 bg-slate-100" />
    ),
  },
);

type DistrictMapShellProps = Pick<
  MapPayload,
  'featureCollection' | 'winnersByYear' | 'winnerHistoryByAc' | 'availableYears' | 'initialYear'
>;

export function DistrictMapShell(props: DistrictMapShellProps) {
  return <DistrictMap {...props} />;
}
