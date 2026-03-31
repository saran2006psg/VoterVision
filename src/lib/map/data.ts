import fs from 'node:fs/promises';
import path from 'node:path';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/drizzle';
import { constituencies, election_results } from '@/db/schema';
import type {
  CandidateResult,
  ConstituencyFeature,
  ConstituencyFeatureCollection,
  MapPayload,
  WinnerHistoryByAcMap,
  WinnerRow,
  WinnersByYearMap,
} from './types';

type GenericFeature = Feature<Geometry, Record<string, unknown>>;

type GenericFeatureCollection = FeatureCollection<Geometry, Record<string, unknown>>;

const PUBLIC_GEOJSON_PATH = path.join(process.cwd(), 'public', 'data', 'tn_ac_2021.geojson');

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]+/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeText = (value: unknown, fallback = '') => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
};

const extractAcNo = (properties: Record<string, unknown>) => {
  return toNumber(properties.AC_NO ?? properties.ac_no ?? properties.Assembly_No ?? properties.Constituency_No);
};

const normalizeFeature = (feature: GenericFeature): ConstituencyFeature | null => {
  const props = feature.properties ?? {};
  const acNo = extractAcNo(props);

  if (!acNo) {
    return null;
  }

  return {
    type: 'Feature',
    geometry: feature.geometry,
    properties: {
      ac_no: acNo,
      name: normalizeText(props.AC_NAME ?? props.name ?? props.Constituency_Name, `AC ${acNo}`),
      district: normalizeText(props.DISTRICT_NAME ?? props.district ?? props.District_Name, 'Unknown'),
    },
  };
};

const loadPublicGeoJson = async (): Promise<ConstituencyFeatureCollection | null> => {
  try {
    const content = await fs.readFile(PUBLIC_GEOJSON_PATH, 'utf8');
    const raw = JSON.parse(content) as GenericFeatureCollection;

    if (!raw.features || !Array.isArray(raw.features)) {
      return null;
    }

    // Tamil Nadu bounds: only include features within TN
    // Precise bounds to include all of TN and exclude neighboring states
    const TN_BOUNDS = {
      minLat: 8.0,
      maxLat: 13.25,
      minLon: 76.25,
      maxLon: 80.35,
    };

    const features = raw.features
      .map((feature) => normalizeFeature(feature))
      .filter((feature): feature is ConstituencyFeature => feature !== null)
      .filter((feature) => {
        // Filter to only Tamil Nadu based on geometry bounds
        const geometry = feature.geometry as any;
        if (!geometry || !geometry.coordinates) return false;

        // For Polygon: coordinates[0][0] or check centroid
        if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates[0])) {
          const coords = geometry.coordinates[0];
          const centerLon = coords.reduce((sum: number, c: any) => sum + c[0], 0) / coords.length;
          const centerLat = coords.reduce((sum: number, c: any) => sum + c[1], 0) / coords.length;
          return centerLat >= TN_BOUNDS.minLat && centerLat <= TN_BOUNDS.maxLat &&
                 centerLon >= TN_BOUNDS.minLon && centerLon <= TN_BOUNDS.maxLon;
        }

        // For MultiPolygon
        if (geometry.type === 'MultiPolygon') {
          return true; // Keep multipolygon features
        }

        return true;
      });

    if (features.length === 0) {
      return null;
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  } catch {
    return null;
  }
};

const loadFeaturesFromDatabase = async (): Promise<ConstituencyFeatureCollection> => {
  const rows = await db
    .select({
      acNo: constituencies.ac_no,
      name: constituencies.name,
      district: constituencies.district,
      geometry: constituencies.geometry,
    })
    .from(constituencies);

  const features = rows
    .map((row) => {
      const rawGeometry = row.geometry as Record<string, unknown> | null;
      if (!rawGeometry) {
        return null;
      }

      if ((rawGeometry.type as string) === 'Feature' && rawGeometry.geometry) {
        return {
          type: 'Feature',
          geometry: rawGeometry.geometry as Geometry,
          properties: {
            ac_no: row.acNo,
            name: row.name,
            district: row.district,
          },
        } satisfies ConstituencyFeature;
      }

      return {
        type: 'Feature',
        geometry: rawGeometry as unknown as Geometry,
        properties: {
          ac_no: row.acNo,
          name: row.name,
          district: row.district,
        },
      } satisfies ConstituencyFeature;
    })
    .filter((feature): feature is ConstituencyFeature => feature !== null);

  return {
    type: 'FeatureCollection',
    features,
  };
};

const parseWinnerRows = (rows: Array<{
  constituencyId: number;
  acNo: number;
  constituencyName: string;
  district: string;
  year: number;
  party: string;
  votes: number;
  voteShare: string;
  margin: number;
  marginPercentage: string;
  turnoutPercentage: string;
  electors: number;
  validVotes: number;
  candidateName: string;
}>): WinnerRow[] => {
  return rows.map((row) => ({
    constituencyId: row.constituencyId,
    acNo: row.acNo,
    constituencyName: row.constituencyName,
    district: row.district,
    year: row.year,
    party: row.party,
    votes: row.votes,
    voteShare: toNumber(row.voteShare),
    margin: row.margin,
    marginPercentage: toNumber(row.marginPercentage),
    turnoutPercentage: toNumber(row.turnoutPercentage),
    electors: row.electors,
    validVotes: row.validVotes,
    candidateName: row.candidateName,
  }));
};

const buildWinnerMaps = (winnerRows: WinnerRow[]) => {
  const winnersByYear: WinnersByYearMap = {};
  const winnerHistoryByAc: WinnerHistoryByAcMap = {};

  for (const row of winnerRows) {
    if (!winnersByYear[row.year]) {
      winnersByYear[row.year] = {};
    }

    winnersByYear[row.year][row.acNo] = row;

    if (!winnerHistoryByAc[row.acNo]) {
      winnerHistoryByAc[row.acNo] = [];
    }

    winnerHistoryByAc[row.acNo].push(row);
  }

  for (const acNo of Object.keys(winnerHistoryByAc)) {
    winnerHistoryByAc[Number(acNo)].sort((a, b) => b.year - a.year);
  }

  return { winnersByYear, winnerHistoryByAc };
};

export const getMapPayload = async (): Promise<MapPayload> => {
  const winnerQueryRows = await db
    .select({
      constituencyId: constituencies.id,
      acNo: constituencies.ac_no,
      constituencyName: constituencies.name,
      district: constituencies.district,
      year: election_results.year,
      party: election_results.party,
      votes: election_results.votes,
      voteShare: election_results.vote_share,
      margin: election_results.margin,
      marginPercentage: election_results.margin_percentage,
      turnoutPercentage: election_results.turnout_percentage,
      electors: election_results.electors,
      validVotes: election_results.valid_votes,
      candidateName: election_results.candidate_name,
    })
    .from(election_results)
    .innerJoin(constituencies, eq(election_results.constituency_id, constituencies.id))
    .where(eq(election_results.winner, true));

  const winnerRows = parseWinnerRows(winnerQueryRows);
  const availableYears = [...new Set(winnerRows.map((row) => row.year))].sort((a, b) => b - a);
  const initialYear = availableYears[0] ?? 2021;

  const featureCollection = (await loadPublicGeoJson()) ?? (await loadFeaturesFromDatabase());

  const { winnersByYear, winnerHistoryByAc } = buildWinnerMaps(winnerRows);

  return {
    featureCollection,
    winnersByYear,
    winnerHistoryByAc,
    availableYears,
    initialYear,
  };
};

export const getYearWinnerSummary = async (year: number): Promise<WinnerRow[]> => {
  const rows = await db
    .select({
      constituencyId: constituencies.id,
      acNo: constituencies.ac_no,
      constituencyName: constituencies.name,
      district: constituencies.district,
      year: election_results.year,
      party: election_results.party,
      votes: election_results.votes,
      voteShare: election_results.vote_share,
      margin: election_results.margin,
      marginPercentage: election_results.margin_percentage,
      turnoutPercentage: election_results.turnout_percentage,
      electors: election_results.electors,
      validVotes: election_results.valid_votes,
      candidateName: election_results.candidate_name,
    })
    .from(election_results)
    .innerJoin(constituencies, eq(election_results.constituency_id, constituencies.id))
    .where(and(eq(election_results.winner, true), eq(election_results.year, year)));

  return parseWinnerRows(rows);
};

export const getAllCandidatesByConstituencyYear = async (
  constituencyId: number,
  year: number
): Promise<CandidateResult[]> => {
  const rows = await db
    .select({
      constituencyId: constituencies.id,
      acNo: constituencies.ac_no,
      constituencyName: constituencies.name,
      year: election_results.year,
      party: election_results.party,
      votes: election_results.votes,
      voteShare: election_results.vote_share,
      position: election_results.position,
      candidateName: election_results.candidate_name,
    })
    .from(election_results)
    .innerJoin(constituencies, eq(election_results.constituency_id, constituencies.id))
    .where(
      and(
        eq(election_results.constituency_id, constituencyId),
        eq(election_results.year, year)
      )
    );

  return rows
    .map((row) => ({
      constituencyId: row.constituencyId,
      acNo: row.acNo,
      constituencyName: row.constituencyName,
      year: row.year,
      party: row.party,
      votes: row.votes,
      voteShare: toNumber(row.voteShare),
      position: row.position,
      candidateName: row.candidateName,
    }))
    .sort((a, b) => a.position - b.position);
};
