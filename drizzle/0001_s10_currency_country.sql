ALTER TABLE `snapshots` ADD `currency` text DEFAULT 'GBP' NOT NULL;--> statement-breakpoint
ALTER TABLE `snapshots` ADD `country_code` text DEFAULT 'GB' NOT NULL;