CREATE TABLE `commissionRules` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`businessType` varchar(255) NOT NULL,
	`angariadorPercentage` decimal(5,2) NOT NULL,
	`vendedorPercentage` decimal(5,2) NOT NULL,
	`description` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissionRules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissions` (
	`id` varchar(64) NOT NULL,
	`saleId` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`brokerId` varchar(64) NOT NULL,
	`commissionValue` decimal(15,2) NOT NULL,
	`commissionPercentage` decimal(5,2) NOT NULL,
	`type` enum('angariacao','venda','parceria') NOT NULL,
	`status` enum('pending','received','paid','cancelled') NOT NULL DEFAULT 'pending',
	`paymentDate` timestamp,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`address` text,
	`logo` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`propertyReference` varchar(64),
	`isFromBaggio` boolean DEFAULT false,
	`address` text NOT NULL,
	`zipCode` varchar(10),
	`neighborhood` varchar(255),
	`city` varchar(255),
	`state` varchar(2),
	`number` varchar(20),
	`complement` text,
	`advertisementValue` decimal(15,2),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`propertyId` varchar(64) NOT NULL,
	`buyerName` varchar(255) NOT NULL,
	`buyerCpfCnpj` varchar(20),
	`saleDate` timestamp,
	`angariationDate` timestamp,
	`saleValue` decimal(15,2) NOT NULL,
	`clientOrigin` varchar(255),
	`paymentMethod` varchar(255),
	`brokerAngariador` varchar(64),
	`brokerVendedor` varchar(64),
	`businessType` varchar(255),
	`status` enum('pending','received','paid','cancelled') NOT NULL DEFAULT 'pending',
	`observation` text,
	`proposalDocumentUrl` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `loginMethod` varchar(64) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','manager','broker','finance') NOT NULL DEFAULT 'broker';--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;--> statement-breakpoint
ALTER TABLE `users` ADD `companyId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `isActive` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_email_unique` UNIQUE(`email`);