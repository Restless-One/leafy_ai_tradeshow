CREATE TABLE `ai_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`explanation` text NOT NULL,
	`evidence_json` text NOT NULL,
	`confidence` real NOT NULL,
	`risk` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `approval_decisions` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`decision` text NOT NULL,
	`comment` text,
	`actor` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`actor` text NOT NULL,
	`summary` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `execution_results` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`adapter` text NOT NULL,
	`outcome` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `growing_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`crop` text NOT NULL,
	`cultivar` text NOT NULL,
	`current_day` real NOT NULL,
	`target_days` real NOT NULL,
	`stage` text NOT NULL,
	`next_milestone` text NOT NULL,
	`next_milestone_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `harvest_outcomes` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`harvested_at` text NOT NULL,
	`yield_grams` real NOT NULL,
	`notes` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `image_observations` (
	`id` text PRIMARY KEY NOT NULL,
	`layer_id` text NOT NULL,
	`canopy_coverage` real NOT NULL,
	`crowding_risk` text NOT NULL,
	`confidence` real NOT NULL,
	`observed_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `proposed_actions` (
	`id` text PRIMARY KEY NOT NULL,
	`recommendation_id` text NOT NULL,
	`actuator` text NOT NULL,
	`command` text NOT NULL,
	`target` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`rationale` text NOT NULL,
	`validation_json` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`decided_by` text,
	`decided_at` text,
	`decision_comment` text
);
--> statement-breakpoint
CREATE TABLE `sensor_readings` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`label` text NOT NULL,
	`value` real NOT NULL,
	`unit` text NOT NULL,
	`status` text NOT NULL,
	`trend` real NOT NULL,
	`sparkline_json` text NOT NULL,
	`recorded_at` text NOT NULL
);
