CREATE TABLE `goalIndicators` (
	`id` varchar(64) NOT NULL,
	`goalId` varchar(64) NOT NULL,
	`indicatorName` varchar(100) NOT NULL,
	`targetValue` decimal(15,2),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goalIndicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `goals` ADD `managerId` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `goals` DROP COLUMN `month`;--> statement-breakpoint
ALTER TABLE `goals` DROP COLUMN `teamGoal`;