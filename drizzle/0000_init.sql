CREATE TABLE `api_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`prefix` text NOT NULL,
	`token_hash` text NOT NULL,
	`last_used_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `api_tokens_token_hash_unique` ON `api_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `api_tokens_user_idx` ON `api_tokens` (`user_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `cache_entries` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goal_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`title` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`goal_id`) REFERENCES `goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `milestones_goal_idx` ON `goal_milestones` (`goal_id`);--> statement-breakpoint
CREATE TABLE `goals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`identity` text,
	`color` text DEFAULT 'mint' NOT NULL,
	`target_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`habit_ids` text DEFAULT '[]' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `goals_user_idx` ON `goals` (`user_id`);--> statement-breakpoint
CREATE TABLE `habit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`habit_id` text NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`status` text DEFAULT 'done' NOT NULL,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`habit_id`) REFERENCES `habits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `habit_logs_habit_date_uq` ON `habit_logs` (`habit_id`,`date`);--> statement-breakpoint
CREATE INDEX `habit_logs_user_date_idx` ON `habit_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `habits` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`emoji` text,
	`color` text DEFAULT 'mint' NOT NULL,
	`kind` text DEFAULT 'build' NOT NULL,
	`frequency` text DEFAULT 'daily' NOT NULL,
	`days_of_week` text DEFAULT '[0,1,2,3,4,5,6]' NOT NULL,
	`times_per_period` integer DEFAULT 1 NOT NULL,
	`identity` text,
	`cue_time` text,
	`cue_location` text,
	`stack_after` text,
	`two_minute_version` text,
	`reward` text,
	`notes` text,
	`start_date` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`archived_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `habits_user_idx` ON `habits` (`user_id`);--> statement-breakpoint
CREATE TABLE `mindset_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`date` text NOT NULL,
	`energy` integer,
	`focus` integer,
	`motivation` integer,
	`note` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mindset_user_date_uq` ON `mindset_logs` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`done` integer DEFAULT false NOT NULL,
	`done_at` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `tasks_user_date_idx` ON `tasks` (`user_id`,`date`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`week_start` integer DEFAULT 1 NOT NULL,
	`units` text DEFAULT 'metric' NOT NULL,
	`location_name` text,
	`latitude` real,
	`longitude` real,
	`identity_statement` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);