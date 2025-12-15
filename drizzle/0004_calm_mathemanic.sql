ALTER TABLE `users` MODIFY COLUMN `role` enum('superadmin','admin','manager','broker','finance') NOT NULL DEFAULT 'broker';--> statement-breakpoint
ALTER TABLE `companies` ADD `licenseType` enum('trial','monthly','annual') DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE `companies` ADD `licenseExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `companies` ADD `isActive` boolean DEFAULT true;