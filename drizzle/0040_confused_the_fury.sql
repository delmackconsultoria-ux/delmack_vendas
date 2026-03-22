CREATE TABLE `indicatorSnapshots` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`month` varchar(7) NOT NULL,
	`indicatorName` varchar(255) NOT NULL,
	`value` decimal(20,2) NOT NULL,
	`unit` varchar(50),
	`metadata` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `indicatorSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properfySyncErrors` (
	`id` varchar(64) NOT NULL,
	`syncHistoryId` varchar(64) NOT NULL,
	`recordId` varchar(64),
	`errorMessage` text NOT NULL,
	`errorCode` varchar(50),
	`errorStack` text,
	`retryCount` int DEFAULT 0,
	`nextRetryAt` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `properfySyncErrors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properfySyncHistory` (
	`id` varchar(64) NOT NULL,
	`syncType` enum('cards','properties','leads') NOT NULL,
	`status` enum('pending','in_progress','completed','failed','partial') NOT NULL,
	`startedAt` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	`totalRecords` int DEFAULT 0,
	`processedRecords` int DEFAULT 0,
	`failedRecords` int DEFAULT 0,
	`errorMessage` text,
	`lastPageProcessed` int DEFAULT 0,
	`nextPageToProcess` int DEFAULT 1,
	`totalPages` int DEFAULT 0,
	`durationSeconds` int,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properfySyncHistory_id` PRIMARY KEY(`id`)
);
