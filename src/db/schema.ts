import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';

export const constituencies = pgTable('constituencies', {
  id: serial('id').primaryKey(),
  ac_no: integer('ac_no').notNull(),
  name: text('name').notNull(),
  district: text('district').notNull(),
  geometry: jsonb('geometry').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  acNoUnique: uniqueIndex('constituencies_ac_no_unique').on(table.ac_no),
  districtIndex: index('constituencies_district_idx').on(table.district),
}));

export const election_results = pgTable('election_results', {
  id: serial('id').primaryKey(),
  constituency_id: integer('constituency_id')
    .notNull()
    .references(() => constituencies.id),
  year: integer('year').notNull(),
  party: text('party').notNull(),
  votes: integer('votes').notNull(),
  vote_share: numeric('vote_share', { precision: 5, scale: 2 }).notNull(),
  winner: boolean('winner').notNull().default(false),
  margin: integer('margin').notNull().default(0),
  margin_percentage: numeric('margin_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  turnout_percentage: numeric('turnout_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  electors: integer('electors').notNull().default(0),
  valid_votes: integer('valid_votes').notNull().default(0),
  position: integer('position').notNull(),
  candidate_name: text('candidate_name').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  constituencyYearPartyUid: uniqueIndex('election_results_constituency_year_party_uid').on(
    table.constituency_id,
    table.year,
    table.party,
  ),
  constituencyIdx: index('election_results_constituency_idx').on(table.constituency_id),
  yearIdx: index('election_results_year_idx').on(table.year),
}));

export const predictions = pgTable('predictions', {
  id: serial('id').primaryKey(),
  constituency_id: integer('constituency_id')
    .notNull()
    .references(() => constituencies.id),
  year: integer('year').notNull(),
  party: text('party').notNull(),
  win_probability: numeric('win_probability', { precision: 5, scale: 2 }).notNull(),
  vote_share_pred: numeric('vote_share_pred', { precision: 5, scale: 2 }).notNull(),
  swing: numeric('swing', { precision: 5, scale: 2 }).notNull(),
  confidence: numeric('confidence', { precision: 5, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  predictionUnique: uniqueIndex('predictions_constituency_year_party_uid').on(
    table.constituency_id,
    table.year,
    table.party,
  ),
  constituencyIdx: index('predictions_constituency_idx').on(table.constituency_id),
}));

export const survey_responses = pgTable('survey_responses', {
  id: serial('id').primaryKey(),
  constituency_id: integer('constituency_id')
    .notNull()
    .references(() => constituencies.id),
  party: text('party').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  constituencyIdx: index('survey_responses_constituency_idx').on(table.constituency_id),
}));

export const survey_aggregates = pgTable('survey_aggregates', {
  id: serial('id').primaryKey(),
  constituency_id: integer('constituency_id')
    .notNull()
    .references(() => constituencies.id),
  party: text('party').notNull(),
  count: integer('count').notNull(),
  percentage: numeric('percentage', { precision: 5, scale: 2 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  constituencyPartyUid: uniqueIndex('survey_aggregates_constituency_party_uid').on(
    table.constituency_id,
    table.party,
  ),
  constituencyIdx: index('survey_aggregates_constituency_idx').on(table.constituency_id),
}));

export type Constituency = InferSelectModel<typeof constituencies>;
export type NewConstituency = InferInsertModel<typeof constituencies>;

export type ElectionResult = InferSelectModel<typeof election_results>;
export type NewElectionResult = InferInsertModel<typeof election_results>;

export type Prediction = InferSelectModel<typeof predictions>;
export type NewPrediction = InferInsertModel<typeof predictions>;

export type SurveyResponse = InferSelectModel<typeof survey_responses>;
export type NewSurveyResponse = InferInsertModel<typeof survey_responses>;

export type SurveyAggregate = InferSelectModel<typeof survey_aggregates>;
export type NewSurveyAggregate = InferInsertModel<typeof survey_aggregates>;
