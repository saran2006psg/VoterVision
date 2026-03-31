import Link from 'next/link';
import { getMapPayload } from '@/lib/map/data';
import { DistrictMapShell } from '@/components/map/DistrictMapShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MapPage() {
  const payload = await getMapPayload();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-white">
      {/* Full Screen Map */}
      <DistrictMapShell
        featureCollection={payload.featureCollection}
        winnersByYear={payload.winnersByYear}
        winnerHistoryByAc={payload.winnerHistoryByAc}
        availableYears={payload.availableYears}
        initialYear={payload.initialYear}
      />
    </main>
  );
}
