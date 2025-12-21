ALTER TABLE `users` MODIFY COLUMN `role` enum('superadmin','admin','manager','broker','finance','viewer') NOT NULL DEFAULT 'broker';--> statement-breakpoint
ALTER TABLE `companies` ADD `notificationEmail` varchar(320);--> statement-breakpoint
ALTER TABLE `users` ADD `managerId` varchar(64);