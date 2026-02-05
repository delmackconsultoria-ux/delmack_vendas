CREATE TABLE `salePaymentHistory` (
	`id` varchar(64) NOT NULL,
	`saleId` varchar(64) NOT NULL,
	`fieldChanged` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text NOT NULL,
	`changedBy` varchar(64) NOT NULL,
	`changedByName` varchar(255),
	`reason` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `salePaymentHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sales` ADD `listingDate` timestamp;--> statement-breakpoint
ALTER TABLE `sales` ADD `listingStore` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `sellingStore` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `team` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `region` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `managementResponsible` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `deedStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `sales` ADD `bankName` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `financedAmount` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `bankReturnPercentage` decimal(5,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `bankReturnAmount` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `observations` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `wasRemoved` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `sales` ADD `priceDiscount` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `listingToSaleDays` int;--> statement-breakpoint
ALTER TABLE `sales` ADD `commissionPaymentDate` timestamp;--> statement-breakpoint
ALTER TABLE `sales` ADD `commissionAmountReceived` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `commissionPaymentBank` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `commissionPaymentMethod` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `commissionPaymentObservations` text;