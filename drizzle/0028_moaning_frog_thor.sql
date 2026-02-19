ALTER TABLE `properfyProperties` ADD `chrPurpose` varchar(50);--> statement-breakpoint
ALTER TABLE `properfyProperties` ADD `isActive` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `properfyProperties` ADD `dteNewListing` timestamp;--> statement-breakpoint
ALTER TABLE `properfyProperties` ADD `dteTermination` timestamp;