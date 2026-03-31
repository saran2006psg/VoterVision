import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'csv-parse/sync';
import { eq, sql } from 'drizzle-orm';
import { db } from '../src/db/db';
import {
  constituencies,
  election_results,
  predictions,
  survey_aggregates,
  survey_responses,
} from '../src/db/schema';

type RawRow = {
  State_Name?: string;
  Assembly_No?: string;
  Constituency_No?: string;
  Year?: string;
  month?: string;
  DelimID?: string;
  Poll_No?: string;
  Position?: string;
  Candidate?: string;
  Sex?: string;
  Party?: string;
  Votes?: string;
  Age?: string;
  Candidate_Type?: string;
  Valid_Votes?: string;
  Electors?: string;
  Constituency_Name?: string;
  Constituency_Type?: string;
  District_Name?: string;
  Sub_Region?: string;
  N_Cand?: string;
  Turnout_Percentage?: string;
  Vote_Share_Percentage?: string;
  Deposit_Lost?: string;
  Margin?: string;
  Margin_Percentage?: string;
  ENOP?: string;
  pid?: string;
  Party_Type_TCPD?: string;
  Party_ID?: string;
  last_poll?: string;
  Contested?: string;
  Last_Party?: string;
  Last_Party_ID?: string;
  Last_Constituency_Name?: string;
  Same_Constituency?: string;
  Same_Party?: string;
  No_Terms?: string;
  Turncoat?: string;
  Incumbent?: string;
  Recontest?: string;
  MyNeta_education?: string;
  TCPD_Prof_Main?: string;
  TCPD_Prof_Main_Desc?: string;
  TCPD_Prof_Second?: string;
  TCPD_Prof_Second_Desc?: string;
  Election_Type?: string;
};

const toNumber = (v?: string) => {
  if (v === undefined || v === null || v === '') return 0;
  const clean = v.replace(/[^0-9.-]+/g, '').trim();
  const n = Number(clean);
  return Number.isFinite(n) ? n : 0;
};

const toNumericString = (value: number) => value.toFixed(2);

const DATA_DIR = path.join(process.cwd(), 'data');
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data');
const CSV_CANDIDATES = ['tn_2021_election_results.csv', '2021_data.csv'];
const GEOJSON_CANDIDATES = ['tn_ac_2021.geojson'];

const resolveExistingPath = async (folder: string, fileNames: string[]) => {
  for (const fileName of fileNames) {
    const fullPath = path.join(folder, fileName);
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch {
      // Continue checking next candidate path.
    }
  }

  throw new Error(
    `Required file not found. Checked: ${fileNames.map((f) => path.join(folder, f)).join(', ')}`,
  );
};

const resolveExistingPathFromFolders = async (folders: string[], fileNames: string[]) => {
  const checked: string[] = [];

  for (const folder of folders) {
    for (const fileName of fileNames) {
      const fullPath = path.join(folder, fileName);
      checked.push(fullPath);
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch {
        // Continue checking candidates.
      }
    }
  }

  throw new Error(`Required file not found. Checked: ${checked.join(', ')}`);
};

async function ensureSchema() {
  console.log('[seed] Ensuring database schema exists...');

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS constituencies (
      id serial PRIMARY KEY,
      ac_no integer NOT NULL UNIQUE,
      name text NOT NULL,
      district text NOT NULL,
      geometry jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS election_results (
      id serial PRIMARY KEY,
      constituency_id integer NOT NULL REFERENCES constituencies(id),
      year integer NOT NULL,
      party text NOT NULL,
      votes integer NOT NULL,
      vote_share numeric(5, 2) NOT NULL,
      winner boolean NOT NULL DEFAULT false,
      margin integer NOT NULL DEFAULT 0,
      margin_percentage numeric(5, 2) NOT NULL DEFAULT '0',
      turnout_percentage numeric(5, 2) NOT NULL DEFAULT '0',
      electors integer NOT NULL DEFAULT 0,
      valid_votes integer NOT NULL DEFAULT 0,
      position integer NOT NULL,
      candidate_name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT election_results_constituency_year_party_uid UNIQUE (constituency_id, year, party)
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS predictions (
      id serial PRIMARY KEY,
      constituency_id integer NOT NULL REFERENCES constituencies(id),
      year integer NOT NULL,
      party text NOT NULL,
      win_probability numeric(5, 2) NOT NULL,
      vote_share_pred numeric(5, 2) NOT NULL,
      swing numeric(5, 2) NOT NULL,
      confidence numeric(5, 2) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT predictions_constituency_year_party_uid UNIQUE (constituency_id, year, party)
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS survey_responses (
      id serial PRIMARY KEY,
      constituency_id integer NOT NULL REFERENCES constituencies(id),
      party text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS survey_aggregates (
      id serial PRIMARY KEY,
      constituency_id integer NOT NULL REFERENCES constituencies(id),
      party text NOT NULL,
      count integer NOT NULL,
      percentage numeric(5, 2) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT survey_aggregates_constituency_party_uid UNIQUE (constituency_id, party)
    );
  `);

  await db.execute(sql`CREATE INDEX IF NOT EXISTS constituencies_district_idx ON constituencies(district);`);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS election_results_constituency_idx ON election_results(constituency_id);`,
  );
  await db.execute(sql`CREATE INDEX IF NOT EXISTS election_results_year_idx ON election_results(year);`);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS predictions_constituency_idx ON predictions(constituency_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS survey_responses_constituency_idx ON survey_responses(constituency_id);`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS survey_aggregates_constituency_idx ON survey_aggregates(constituency_id);`,
  );

  console.log('[seed] Schema ready.');
}

async function loadGeoJSON() {
  let geoPath = '';

  try {
    geoPath = await resolveExistingPathFromFolders([DATA_DIR, PUBLIC_DATA_DIR], GEOJSON_CANDIDATES);
    const raw = await fs.readFile(geoPath, 'utf8');
    const parsed = JSON.parse(raw) as {
      features?: Array<{
        properties?: {
          AC_NO?: string | number;
          Assembly_No?: string | number;
          Constituency_No?: string | number;
        };
      }>;
    };

    if (!parsed.features) return new Map<number, any>();

    const map = new Map<number, any>();
    for (const feature of parsed.features) {
      const acNo = Number(
        feature?.properties?.AC_NO ??
          feature?.properties?.Assembly_No ??
          feature?.properties?.Constituency_No,
      );
      if (!Number.isFinite(acNo)) continue;
      map.set(acNo, feature);
    }

    console.log(`[seed] Loaded ${map.size} constituency geometries from ${geoPath}`);
    return map;
  } catch (error) {
    const baseMessage = error instanceof Error ? error.message : String(error);
    if (geoPath) {
      console.warn(`[seed] GeoJSON load failed from ${geoPath}: ${baseMessage}`);
    } else {
      console.warn(`[seed] GeoJSON load skipped: ${baseMessage}`);
    }

    return new Map<number, any>();
  }
}

export async function runSeed() {
  await ensureSchema();

  const csvPath = await resolveExistingPath(DATA_DIR, CSV_CANDIDATES);
  const csvRaw = await fs.readFile(csvPath, 'utf8');
  const rows = parse(csvRaw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as RawRow[];

  console.log(`[seed] Loaded ${rows.length} rows from ${csvPath}`);

  const geoMap = await loadGeoJSON();

  type GroupKey = `${number}-${number}`;
  const ballots = new Map<
    GroupKey,
    {
      acNo: number;
      year: number;
      constituencyName: string;
      district: string;
      electors: number;
      validVotes: number;
      turnout: number;
      candidates: Array<{
        party: string;
        candidate: string;
        votes: number;
        position: number;
        voteShare: number;
        margin: number;
        marginPercentage: number;
      }>;
    }
  >();

  for (const row of rows) {
    const acNo = toNumber(row.Constituency_No || row.Assembly_No);
    const year = toNumber(row.Year);
    if (!acNo || !year) continue;

    const party = (row.Party || 'UNKNOWN').trim();
    const candidate = (row.Candidate || 'UNKNOWN').trim();
    const votes = toNumber(row.Votes);
    const position = Math.max(1, toNumber(row.Position));
    const voteShare = toNumber(row.Vote_Share_Percentage);
    const margin = toNumber(row.Margin);
    const marginPercentage = toNumber(row.Margin_Percentage);

    const key = `${acNo}-${year}` as GroupKey;
    if (!ballots.has(key)) {
      ballots.set(key, {
        acNo,
        year,
        constituencyName: (row.Constituency_Name || '').trim(),
        district: (row.District_Name || '').trim(),
        electors: toNumber(row.Electors),
        validVotes: toNumber(row.Valid_Votes),
        turnout: toNumber(row.Turnout_Percentage),
        candidates: [],
      });
    }

    ballots
      .get(key)!
      .candidates.push({ party, candidate, votes, position, voteShare, margin, marginPercentage });
  }

  console.log(`[seed] Seeding ${ballots.size} constituency-year groups...`);

  let insertedConstituencies = 0;
  let insertedElectionResults = 0;
  let updatedConstituencies = 0;

  for (const bucket of ballots.values()) {
    const existingCon = await db
      .select({ id: constituencies.id })
      .from(constituencies)
      .where(eq(constituencies.ac_no, bucket.acNo));

    let constituencyId: number;
    if (existingCon.length > 0) {
      constituencyId = existingCon[0].id;
      const geoFeature = geoMap.get(bucket.acNo);
      if (geoFeature) {
        await db
          .update(constituencies)
          .set({
            name: bucket.constituencyName || `AC ${bucket.acNo}`,
            district: bucket.district || 'Unknown',
            geometry: geoFeature,
          })
          .where(eq(constituencies.id, constituencyId));
        updatedConstituencies += 1;
      }
    } else {
      const geoFeature = geoMap.get(bucket.acNo);
      const geometry = geoFeature ? geoFeature : { type: 'FeatureCollection', features: [] };
      const insertResult = await db
        .insert(constituencies)
        .values({
          ac_no: bucket.acNo,
          name: bucket.constituencyName || `AC ${bucket.acNo}`,
          district: bucket.district || 'Unknown',
          geometry,
        })
        .onConflictDoNothing()
        .returning({ id: constituencies.id });

      if (insertResult.length > 0) {
        constituencyId = insertResult[0].id;
        insertedConstituencies += 1;
      } else {
        const lookup = await db
          .select({ id: constituencies.id })
          .from(constituencies)
          .where(eq(constituencies.ac_no, bucket.acNo));
        if (!lookup.length) {
          throw new Error(`[seed] Failed to insert or retrieve constituency AC ${bucket.acNo}`);
        }
        constituencyId = lookup[0].id;
      }
    }

    const byParty = new Map<string, { votes: number; candidate: string; position: number }>();
    let winnerParty = '';
    let winnerVotes = -1;
    let secondVotes = -1;

    for (const candidate of bucket.candidates) {
      const partyEntry = byParty.get(candidate.party) ?? { votes: 0, candidate: '', position: 999 };
      const mergedVotes = partyEntry.votes + candidate.votes;
      const bestPosition = Math.min(partyEntry.position, candidate.position);
      const candidateName =
        candidate.position <= partyEntry.position
          ? candidate.candidate
          : partyEntry.candidate || candidate.candidate;

      byParty.set(candidate.party, {
        votes: mergedVotes,
        candidate: candidateName,
        position: bestPosition,
      });

      if (candidate.position === 1) {
        winnerParty = candidate.party;
      }
    }

    const sortedPartyVotes = Array.from(byParty.entries())
      .map(([party, data]) => ({ party, ...data }))
      .sort((a, b) => b.votes - a.votes);

    if (sortedPartyVotes.length > 0 && !winnerParty) {
      winnerVotes = sortedPartyVotes[0].votes;
      secondVotes = sortedPartyVotes[1]?.votes ?? 0;
      winnerParty = sortedPartyVotes[0].party;
    } else if (sortedPartyVotes.length > 0) {
      winnerVotes = sortedPartyVotes.find((p) => p.party === winnerParty)?.votes ?? sortedPartyVotes[0].votes;
      secondVotes = sortedPartyVotes.find((p) => p.party !== winnerParty)?.votes ?? 0;
    }

    const lockValidVotes = bucket.validVotes || winnerVotes || 1;
    const lockElectors = bucket.electors || Math.round(lockValidVotes / 0.7) || lockValidVotes;
    const lockTurnout = bucket.turnout || (lockValidVotes / lockElectors) * 100;

    const margin = Math.max(0, (winnerVotes || 0) - (secondVotes || 0));
    const marginPercentage = lockValidVotes ? (margin / lockValidVotes) * 100 : 0;

    for (const [party, summary] of byParty.entries()) {
      const isWinner = party === winnerParty;
      const voteShare = lockValidVotes > 0 ? (summary.votes / lockValidVotes) * 100 : 0;

      await db
        .insert(election_results)
        .values({
          constituency_id: constituencyId,
          year: bucket.year,
          party,
          votes: summary.votes,
          vote_share: toNumericString(voteShare),
          winner: isWinner,
          margin: isWinner ? margin : 0,
          margin_percentage: toNumericString(isWinner ? marginPercentage : 0),
          turnout_percentage: toNumericString(lockTurnout),
          electors: Math.round(lockElectors),
          valid_votes: Math.round(lockValidVotes),
          position: summary.position,
          candidate_name: summary.candidate || 'Unknown',
        })
        .onConflictDoUpdate({
          target: [
            election_results.constituency_id,
            election_results.year,
            election_results.party,
          ],
          set: {
            votes: summary.votes,
            vote_share: toNumericString(voteShare),
            winner: isWinner,
            margin: isWinner ? margin : 0,
            margin_percentage: toNumericString(isWinner ? marginPercentage : 0),
            turnout_percentage: toNumericString(lockTurnout),
            electors: Math.round(lockElectors),
            valid_votes: Math.round(lockValidVotes),
            position: summary.position,
            candidate_name: summary.candidate || 'Unknown',
          },
        });

      insertedElectionResults += 1;
    }
  }

  console.log(`[seed] Inserted ${insertedConstituencies} new constituencies`);
  console.log(`[seed] Updated ${updatedConstituencies} existing constituencies`);
  console.log(`[seed] Upserted ${insertedElectionResults} election result rows`);

  const constituencyIds = (
    await db.select({ id: constituencies.id }).from(constituencies).limit(10)
  ).map((row) => row.id);

  for (let i = 0; i < 10; i += 1) {
    const cid = constituencyIds[i % Math.max(1, constituencyIds.length)] ?? 0;
    if (!cid) continue;

    const party = i % 2 === 0 ? 'DMK' : 'AIADMK';
    await db.insert(predictions).values({
      constituency_id: cid,
      year: 2026,
      party,
      win_probability: toNumericString(Math.random() * 100),
      vote_share_pred: toNumericString(30 + Math.random() * 40),
      swing: toNumericString(Math.random() * 10 - 5),
      confidence: toNumericString(60 + Math.random() * 40),
    }).onConflictDoUpdate({
      target: [predictions.constituency_id, predictions.year, predictions.party],
      set: {
        win_probability: toNumericString(Math.random() * 100),
        vote_share_pred: toNumericString(30 + Math.random() * 40),
        swing: toNumericString(Math.random() * 10 - 5),
        confidence: toNumericString(60 + Math.random() * 40),
      },
    });

    await db.insert(survey_responses).values({
      constituency_id: cid,
      party,
    });
  }

  const existingSurvey = await db
    .select({
      constituency_id: survey_responses.constituency_id,
      party: survey_responses.party,
    })
    .from(survey_responses)
    .limit(100);

  const counts = new Map<string, number>();
  for (const row of existingSurvey) {
    const key = `${row.constituency_id}-${row.party}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let aggregateRows = 0;
  for (const [key, count] of counts.entries()) {
    const [cidStr, party] = key.split('-', 2);
    const cid = Number(cidStr);
    if (!cid) continue;
    const total = Math.max(
      10,
      Array.from(counts.entries())
        .filter(([k]) => k.startsWith(`${cid}-`))
        .reduce((acc, [, c]) => acc + c, 0),
    );
    const percentage = (count / total) * 100;
    await db
      .insert(survey_aggregates)
      .values({
        constituency_id: cid,
        party,
        count,
        percentage: toNumericString(percentage),
      })
      .onConflictDoUpdate({
        target: [survey_aggregates.constituency_id, survey_aggregates.party],
        set: {
          count,
          percentage: toNumericString(percentage),
        },
      });

    aggregateRows += 1;
    if (aggregateRows >= 10) break;
  }

  console.log(`[seed] Inserted ${aggregateRows} survey_aggregates rows`);

  return {
    constituencies: insertedConstituencies,
    updatedConstituencies,
    electionResults: insertedElectionResults,
    predictions: 10,
    surveyAggregates: Math.min(10, aggregateRows),
  };
}

const currentFilePath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFilePath)) {
  runSeed()
    .then((result) => {
      console.log('[seed] Completed successfully:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('[seed] Failed:', error);
      process.exit(1);
    });
}

export default runSeed;
