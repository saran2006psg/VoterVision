import { getAllCandidatesByConstituencyYear } from '@/lib/map/data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const constituencyId = searchParams.get('constituencyId');
  const year = searchParams.get('year');

  if (!constituencyId || !year) {
    return Response.json(
      { error: 'Missing required parameters: constituencyId and year' },
      { status: 400 }
    );
  }

  try {
    const candidates = await getAllCandidatesByConstituencyYear(
      parseInt(constituencyId, 10),
      parseInt(year, 10)
    );
    return Response.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return Response.json(
      { error: 'Failed to fetch candidates' },
      { status: 500 }
    );
  }
}
