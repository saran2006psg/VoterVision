import { runSeed } from '../../scripts/seed';
import Link from 'next/link';

export const metadata = {
  title: 'VoteVision TN - Phase 1',
};

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">VoteVision TN: Phase 1 Seed</h1>
        <p className="mt-2 text-sm text-slate-600">
          Click to seed database from data/tn_2021_election_results.csv and data/tn_ac_2021.geojson.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Phase 2 map is ready at /map.
        </p>
        <form action={runSeedAction} className="mt-4">
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
          >
            Run Seed
          </button>
        </form>
        <div className="mt-3">
          <Link
            href="/map"
            className="inline-flex rounded border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            Open Interactive Map
          </Link>
        </div>
      </div>
    </main>
  );
}

async function runSeedAction() {
  'use server';
  try {
    const result = await runSeed();
    console.log('[page] Seed action completed', result);
  } catch (error) {
    console.error('[page] Seed action error', error);
  }
}
