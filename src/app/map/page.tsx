import Link from 'next/link';
import { getMapPayload } from '@/lib/map/data';
import { DistrictMapShell } from '@/components/map/DistrictMapShell';

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

      {/* Top Right Back Button */}
      <Link
        href="/"
        className="absolute top-4 right-4 z-[600] rounded-lg border border-slate-300 bg-white/90 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-white transition backdrop-blur-sm shadow-md"
      >
        ← Back
      </Link>
    </main>
  );
}
