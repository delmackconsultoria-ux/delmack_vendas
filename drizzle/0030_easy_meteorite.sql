CREATE TABLE `properfyLeads` (
	`id` varchar(64) NOT NULL,
	`propertyId` varchar(64),
	`leadId` varchar(64) NOT NULL,
	`leadName` varchar(255),
	`leadEmail` varchar(320),
	`leadPhone` varchar(20),
	`leadType` enum('ready','launch','other') DEFAULT 'other',
	`status` varchar(64) DEFAULT 'active',
	`createdAt` timestamp,
	`updatedAt` timestamp,
	`syncedAt` timestamp DEFAULT (now()),
	CONSTRAINT `properfyLeads_id` PRIMARY KEY(`id`)
);
