ALTER TABLE `sales` ADD `downPaymentPercentage` decimal(5,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `contractNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `sales` ADD `contractSignatureDate` timestamp;--> statement-breakpoint
ALTER TABLE `sales` ADD `portfolioStatus` varchar(100);