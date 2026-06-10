CREATE TABLE `snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`taken_at` text NOT NULL,
	`ie_json` text NOT NULL,
	`outcome_state` text NOT NULL,
	`band` text,
	`income_pence` integer NOT NULL,
	`expenditure_pence` integer NOT NULL,
	`disposable_pence` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_snapshots_customer_taken` ON `snapshots` (`customer_id`,`taken_at`);