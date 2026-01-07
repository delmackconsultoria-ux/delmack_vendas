ALTER TABLE `sales` ADD `saleType` enum('lancamento','pronto');--> statement-breakpoint
ALTER TABLE `sales` ADD `responsible` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `invoiceNumber` varchar(100);