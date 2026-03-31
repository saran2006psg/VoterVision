import Link from 'next/link';
import { getMapPayload } from '@/lib/map/data';
import { DistrictMapShell } from '@/components/map/DistrictMapShell';

export default async function MapPage() {
  const payload = await getMapPayload();

  return (
    <main className="min-h-screen p-6 md:p-8">
      <section className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">VoteVision TN</p>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Interactive Constituency Map</h1>
            <p className="mt-1 text-sm text-slate-600">
              Explore winners, vote share, turnout, and historical constituency insights across Tamil Nadu.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Back to Seed Page
          </Link>
        </div>

        <DistrictMapShell
          featureCollection={payload.featureCollection}
          winnersByYear={payload.winnersByYear}
          winnerHistoryByAc={payload.winnerHistoryByAc}
          availableYears={payload.availableYears}
          initialYear={payload.initialYear}
        />
      </section>
    </main>
  );
}
