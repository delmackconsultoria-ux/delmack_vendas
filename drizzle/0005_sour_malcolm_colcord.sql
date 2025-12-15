ALTER TABLE `companies` MODIFY COLUMN `licenseType` enum('perpetual','monthly','quarterly','semiannual','annual') DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE `companies` ADD `licenseStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `companies` ADD `contractResponsible` varchar(255);--> statement-breakpoint
ALTER TABLE `companies` ADD `contractResponsibleEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `companies` ADD `contractResponsiblePhone` varchar(20);--> statement-breakpoint
ALTER TABLE `companies` ADD `contractStartDate` timestamp;--> statement-breakpoint
ALTER TABLE `companies` ADD `contractNotes` text;--> statement-breakpoint
ALTER TABLE `companies` ADD `totalLogins` int DEFAULT 0;