CREATE TABLE `indicatorAuditLog` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`fieldName` varchar(64) NOT NULL,
	`previousValue` decimal(15,2),
	`newValue` decimal(15,2) NOT NULL,
	`editedBy` varchar(64) NOT NULL,
	`editedByName` varchar(255),
	`editedAt` timestamp DEFAULT (now()),
	`notes` text,
	CONSTRAINT `indicatorAuditLog_id` PRIMARY KEY(`id`)
);
