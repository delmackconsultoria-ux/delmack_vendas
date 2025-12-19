CREATE TABLE `salesHistory` (
	`id` varchar(64) NOT NULL,
	`saleId` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`changedBy` varchar(64) NOT NULL,
	`changedByName` varchar(255),
	`action` enum('create','update','delete','status_change','approval','rejection') NOT NULL,
	`fieldName` varchar(100),
	`previousValue` text,
	`newValue` text,
	`changeReason` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `salesHistory_id` PRIMARY KEY(`id`)
);
