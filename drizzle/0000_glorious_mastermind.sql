CREATE TABLE "constituencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"ac_no" integer NOT NULL,
	"name" text NOT NULL,
	"district" text NOT NULL,
	"geometry" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "election_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"constituency_id" integer NOT NULL,
	"year" integer NOT NULL,
	"party" text NOT NULL,
	"votes" integer NOT NULL,
	"vote_share" numeric(5, 2) NOT NULL,
	"winner" boolean DEFAULT false NOT NULL,
	"margin" integer DEFAULT 0 NOT NULL,
	"margin_percentage" numeric(5, 2) DEFAULT 0 NOT NULL,
	"turnout_percentage" numeric(5, 2) DEFAULT 0 NOT NULL,
	"electors" integer DEFAULT 0 NOT NULL,
	"valid_votes" integer DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"candidate_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"constituency_id" integer NOT NULL,
	"year" integer NOT NULL,
	"party" text NOT NULL,
	"win_probability" numeric(5, 2) NOT NULL,
	"vote_share_pred" numeric(5, 2) NOT NULL,
	"swing" numeric(5, 2) NOT NULL,
	"confidence" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_aggregates" (
	"id" serial PRIMARY KEY NOT NULL,
	"constituency_id" integer NOT NULL,
	"party" text NOT NULL,
	"count" integer NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"constituency_id" integer NOT NULL,
	"party" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "public"."constituencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "public"."constituencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_aggregates" ADD CONSTRAINT "survey_aggregates_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "public"."constituencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_constituency_id_constituencies_id_fk" FOREIGN KEY ("constituency_id") REFERENCES "public"."constituencies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "constituencies_ac_no_unique" ON "constituencies" USING btree ("ac_no");--> statement-breakpoint
CREATE INDEX "constituencies_district_idx" ON "constituencies" USING btree ("district");--> statement-breakpoint
CREATE UNIQUE INDEX "election_results_constituency_year_party_uid" ON "election_results" USING btree ("constituency_id","year","party");--> statement-breakpoint
CREATE INDEX "election_results_constituency_idx" ON "election_results" USING btree ("constituency_id");--> statement-breakpoint
CREATE INDEX "election_results_year_idx" ON "election_results" USING btree ("year");--> statement-breakpoint
CREATE UNIQUE INDEX "predictions_constituency_year_party_uid" ON "predictions" USING btree ("constituency_id","year","party");--> statement-breakpoint
CREATE INDEX "predictions_constituency_idx" ON "predictions" USING btree ("constituency_id");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_aggregates_constituency_party_uid" ON "survey_aggregates" USING btree ("constituency_id","party");--> statement-breakpoint
CREATE INDEX "survey_aggregates_constituency_idx" ON "survey_aggregates" USING btree ("constituency_id");--> statement-breakpoint
CREATE INDEX "survey_responses_constituency_idx" ON "survey_responses" USING btree ("constituency_id");