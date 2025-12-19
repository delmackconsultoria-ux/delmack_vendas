CREATE TABLE `proposalComments` (
	`id` varchar(64) NOT NULL,
	`saleId` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`userName` varchar(255),
	`previousStatus` varchar(50),
	`newStatus` varchar(50),
	`comment` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `proposalComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `sales` MODIFY COLUMN `status` enum('draft','pending','sale','manager_review','finance_review','commission_paid','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerAngariadorType` enum('internal','external') DEFAULT 'internal';--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerAngariadorName` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerAngariadorCreci` varchar(50);--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerAngariadorEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerVendedorType` enum('internal','external') DEFAULT 'internal';--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerVendedorName` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerVendedorCreci` varchar(50);--> statement-breakpoint
ALTER TABLE `sales` ADD `brokerVendedorEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `sales` ADD `registeredBy` varchar(64);--> statement-breakpoint
ALTER TABLE `sales` ADD `registeredByName` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `registeredAt` timestamp DEFAULT (now());--> statement-breakpoint
ALTER TABLE `sales` ADD `realEstateCommission` decimal(15,2);