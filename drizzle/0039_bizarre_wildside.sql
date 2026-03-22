CREATE TABLE `properfyCards` (
	`id` varchar(64) NOT NULL,
	`pipelineId` int NOT NULL,
	`pipelineName` varchar(255) NOT NULL,
	`timelineId` int NOT NULL,
	`timelineName` varchar(255),
	`leadId` varchar(64),
	`leadName` varchar(255),
	`userId` int,
	`propertyRef` varchar(64),
	`propertyTitle` varchar(255),
	`cardType` varchar(64),
	`createdAt` timestamp,
	`updatedAt` timestamp,
	`syncedAt` timestamp DEFAULT (now()),
	CONSTRAINT `properfyCards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properfyCardsSyncStatus` (
	`id` varchar(64) NOT NULL,
	`lastSyncAt` timestamp DEFAULT (now()),
	`nextSyncAt` timestamp,
	`totalCardsSynced` int DEFAULT 0,
	`status` enum('pending','syncing','completed','failed') DEFAULT 'pending',
	`errorMessage` text,
	CONSTRAINT `properfyCardsSyncStatus_id` PRIMARY KEY(`id`)
);
