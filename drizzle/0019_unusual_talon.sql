CREATE TABLE `monthlyIndicators` (
	`id` varchar(64) NOT NULL,
	`month` varchar(7) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`generalExpense` decimal(15,2),
	`taxExpense` decimal(15,2),
	`innovationFund` decimal(15,2),
	`partnerResult` decimal(15,2),
	`emergencyFund` decimal(15,2),
	`createdBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthlyIndicators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertiesCache` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`properfyId` varchar(64) NOT NULL,
	`chrReference` varchar(255),
	`chrDocument` varchar(255),
	`chrStatus` varchar(50),
	`dteNewListing` timestamp,
	`dteTermination` timestamp,
	`chrTerminationReason` varchar(255),
	`propertyType` varchar(50),
	`saleValue` decimal(15,2),
	`lastSyncAt` timestamp DEFAULT (now()),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `propertiesCache_id` PRIMARY KEY(`id`)
);
