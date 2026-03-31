import { config as loadEnv } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';

// Disable TLS certificate verification for self-signed certificates (development only)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

type RawRow = {
  Constituency_No?: string;
  Assembly_No?: string;
  Year?: string;
  Position?: string;
  Candidate?: string;
  Party?: string;
  Votes?: string;
  Valid_Votes?: string;
  Electors?: string;
  Constituency_Name?: string;
  District_Name?: string;
  Turnout_Percentage?: string;
  Vote_Share_Percentage?: string;
  Margin?: string;
  Margin_Percentage?: string;
};

loadEnv({ path: '.env.local', override: false });

const connectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!connectionString) {
  throw new Error('Missing database connection string in .env.local (SUPABASE_DB_URL or DATABASE_URL).');
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const toNumber = (v?: string): number => {
  if (!v) return 0;
  const n = Number(v.replace(/[^0-9.-]+/g, '').trim());
  return Number.isFinite(n) ? n : 0;
};

async function runSeedPg() {
  const dataPath = path.join(process.cwd(), 'data', '2021_data.csv');
  const rawCsv = await fs.readFile(dataPath, 'utf8');
  const rawRows = parse(rawCsv, { columns: true, skip_empty_lines: true, trim: true }) as RawRow[];
  console.log(`[seed-pg] Loaded ${rawRows.length} rows from ${dataPath}`);

  console.log('[seed-pg] Starting transaction...');
  await pool.query('BEGIN');
  console.log('[seed-pg] Transaction started');

  const createSql = `
    CREATE TABLE IF NOT EXISTS constituencies (
      id SERIAL PRIMARY KEY,
      ac_no INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      geometry JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS election_results (
      id SERIAL PRIMARY KEY,
      constituency_id INTEGER NOT NULL REFERENCES constituencies(id),
      year INTEGER NOT NULL,
      party TEXT NOT NULL,
      votes INTEGER NOT NULL,
      vote_share NUMERIC(5,2) NOT NULL,
      winner BOOLEAN NOT NULL DEFAULT false,
      margin INTEGER NOT NULL DEFAULT 0,
      margin_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
      turnout_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
      electors INTEGER NOT NULL DEFAULT 0,
      valid_votes INTEGER NOT NULL DEFAULT 0,
      position INTEGER NOT NULL,
      candidate_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (constituency_id, year, party)
    );

    CREATE TABLE IF NOT EXISTS predictions (
      id SERIAL PRIMARY KEY,
      constituency_id INTEGER NOT NULL REFERENCES constituencies(id),
      year INTEGER NOT NULL,
      party TEXT NOT NULL,
      win_probability NUMERIC(5,2) NOT NULL,
      vote_share_pred NUMERIC(5,2) NOT NULL,
      swing NUMERIC(5,2) NOT NULL,
      confidence NUMERIC(5,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (constituency_id, year, party)
    );

    CREATE TABLE IF NOT EXISTS survey_responses (
      id SERIAL PRIMARY KEY,
      constituency_id INTEGER NOT NULL REFERENCES constituencies(id),
      party TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS survey_aggregates (
      id SERIAL PRIMARY KEY,
      constituency_id INTEGER NOT NULL REFERENCES constituencies(id),
      party TEXT NOT NULL,
      count INTEGER NOT NULL,
      percentage NUMERIC(5,2) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (constituency_id, party)
    );
  `;

  await pool.query(createSql);
  console.log('[seed-pg] Created/ensured tables');

  type Key = `${number}-${number}`;
  const constituencyGroups = new Map<Key, {
    acNo:number;
    year:number;
    name:string;
    district:string;
    electors:number;
    validVotes:number;
    turnout:number;
    candidates:Array<{ party:string; candidate:string; votes:number; position:number; voteShare:number; margin:number; marginPct:number; }>;
  }>();

  console.log('[seed-pg] Processing CSV rows...');
  for (const row of rawRows) {
    const ac = toNumber(row.Constituency_No || row.Assembly_No);
    const year = toNumber(row.Year);
    if (!ac || !year) continue;

    const party = (row.Party || 'Unknown').trim();
    const candidate = (row.Candidate || 'Unknown').trim();
    const votes = toNumber(row.Votes);
    const position = Math.max(1, toNumber(row.Position));
    const voteShare = toNumber(row.Vote_Share_Percentage);
    const margin = toNumber(row.Margin);
    const marginPct = toNumber(row.Margin_Percentage);

    const key = `${ac}-${year}` as Key;

    if (!constituencyGroups.has(key)) {
      constituencyGroups.set(key, {
        acNo: ac,
        year: year,
        name: (row.Constituency_Name ?? `AC ${ac}`).trim(),
        district: (row.District_Name ?? 'Unknown').trim(),
        electors: toNumber(row.Electors),
        validVotes: toNumber(row.Valid_Votes),
        turnout: toNumber(row.Turnout_Percentage),
        candidates: [],
      });
    }

    constituencyGroups.get(key)!.candidates.push({
      party,
      candidate,
      votes,
      position,
      voteShare,
      margin,
      marginPct,
    });
  }
  console.log(`[seed-pg] Processed into ${constituencyGroups.size} constituency groups`);

  let constituencyInserted = 0;
  let electionInserted = 0;

  console.log('[seed-pg] Inserting data...');
  for (const group of constituencyGroups.values()) {
    const insertCon = await pool.query(
      `INSERT INTO constituencies (ac_no, name, district) VALUES ($1, $2, $3)
       ON CONFLICT (ac_no) DO UPDATE SET name = EXCLUDED.name, district = EXCLUDED.district
       RETURNING id`,
      [group.acNo, group.name, group.district],
    );

    const constituencyId = insertCon.rows[0]?.id;
    if (!constituencyId) throw new Error(`Failed to get constituency id for ac_no ${group.acNo}`);
    constituencyInserted++;

    const partyAgg = new Map<string, { votes: number; position: number; candidate:string; }>();
    for (const c of group.candidates) {
      const existing = partyAgg.get(c.party);
      if (!existing) {
        partyAgg.set(c.party, { votes: c.votes, position: c.position, candidate: c.candidate });
      } else {
        existing.votes += c.votes;
        if (c.position < existing.position) {
          existing.position = c.position;
          existing.candidate = c.candidate;
        }
      }
    }

    const sorted = Array.from(partyAgg.entries()).map(([party, data]) => ({ party, ...data })).sort((a,b)=>b.votes-a.votes);
    const winnerVotes = sorted[0]?.votes || 0;
    const runnerUpVotes = sorted[1]?.votes || 0;
    const margin = winnerVotes - runnerUpVotes;
    const validVotes = group.validVotes || Math.max(1, sorted.reduce((s,v)=>s+v.votes,0));
    const electors = group.electors || Math.max(1, Math.round(validVotes/0.7));
    const turnoutPct = group.turnout || (validVotes / electors) * 100;

    for (const entry of sorted) {
      const isWinner = entry.party === sorted[0]?.party;
      const voteShare = validVotes ? (entry.votes / validVotes) * 100 : 0;

      await pool.query(
        `INSERT INTO election_results (
          constituency_id, year, party, votes, vote_share, winner, margin,
          margin_percentage, turnout_percentage, electors, valid_votes, position, candidate_name
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (constituency_id, year, party) DO NOTHING`,
        [
          constituencyId,
          group.year,
          entry.party,
          entry.votes,
          Number(voteShare.toFixed(2)),
          isWinner,
          isWinner ? margin : 0,
          Number((isWinner ? (margin / (validVotes || 1) * 100) : 0).toFixed(2)),
          Number(turnoutPct.toFixed(2)),
          electors,
          validVotes,
          entry.position,
          entry.candidate,
        ],
      );
      electionInserted++;
    }
  }

  const predictionPromises = [];
  const responsePromises = [];
  const aggregate = new Map<string, number>();

  const constituencyRows = await pool.query('SELECT id FROM constituencies ORDER BY id LIMIT 10');
  const constituencyCount = constituencyRows.rowCount ?? 0;

  for (let idx = 0; idx < constituencyCount && idx < 10; idx++) {
    const cid = constituencyRows.rows[idx].id;
    const party = idx % 2 === 0 ? 'DMK' : 'AIADMK';

    predictionPromises.push(
      pool.query(
        `INSERT INTO predictions (constituency_id, year, party, win_probability, vote_share_pred, swing, confidence)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (constituency_id, year, party) DO NOTHING`,
        [cid, 2026, party, Number((Math.random()*100).toFixed(2)), Number((35 + Math.random()*30).toFixed(2)), Number((Math.random()*10-5).toFixed(2)), Number((60 + Math.random()*40).toFixed(2))],
      ),
    );

    responsePromises.push(
      pool.query(`INSERT INTO survey_responses (constituency_id, party) VALUES ($1,$2)`, [cid, party]),
    );

    const key = `${cid}-${party}`;
    aggregate.set(key, (aggregate.get(key) || 0) + 1);
  }

  await Promise.all(predictionPromises);
  await Promise.all(responsePromises);

  let aggregateInserted = 0;
  for (const [key, count] of aggregate.entries()) {
    const [cidStr, party] = key.split('-', 2);
    const cid = Number(cidStr);
    const total = Array.from(aggregate.entries()).filter(([k]) => k.startsWith(`${cid}-`)).reduce((s, [, c]) => s + c, 0)
    const pct = total ? (count / total) * 100 : 0;
    await pool.query(
      `INSERT INTO survey_aggregates (constituency_id, party, count, percentage)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (constituency_id, party) DO UPDATE SET count = EXCLUDED.count, percentage = EXCLUDED.percentage`,
      [cid, party, count, Number(pct.toFixed(2))],
    );
    aggregateInserted++;
  }

  await pool.query('COMMIT');
  console.log(`[seed-pg] constituencies processed: ${constituencyInserted}`);
  console.log(`[seed-pg] election_results rows inserted: ${electionInserted}`);
  console.log(`[seed-pg] predictions rows: ${predictionPromises.length}`);
  console.log(`[seed-pg] survey_aggregates rows: ${aggregateInserted}`);

  await pool.end();
}

runSeedPg().catch(async (error) => {
  console.error('[seed-pg] Error:', error);
  await pool.query('ROLLBACK').catch(() => {});
  await pool.end();
  process.exit(1);
});
