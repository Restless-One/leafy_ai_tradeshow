CREATE TABLE `farm_alerts` (
	`id` text PRIMARY KEY NOT NULL,
	`severity` text NOT NULL,
	`title` text NOT NULL,
	`detail` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`acknowledged_by` text,
	`acknowledged_at` text,
	`comment` text
);
--> statement-breakpoint
CREATE TABLE `runtime_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`automation_mode` text NOT NULL,
	`updated_by` text NOT NULL,
	`reason` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schedule_events` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`day` integer NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`status` text NOT NULL,
	`detail` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `approval_decisions` ADD `action_version` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `image_observations` ADD `yellowing` text NOT NULL;--> statement-breakpoint
ALTER TABLE `image_observations` ADD `image_quality` text NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_actions` ADD `version` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_actions` ADD `expires_at` text NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_actions` ADD `suggested_risk` text NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_actions` ADD `authoritative_risk` text NOT NULL;--> statement-breakpoint
ALTER TABLE `proposed_actions` ADD `lifecycle_json` text NOT NULL;--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD `safe_min` real NOT NULL;--> statement-breakpoint
ALTER TABLE `sensor_readings` ADD `safe_max` real NOT NULL;