ALTER TABLE `sales` ADD `condominiumName` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `advertisementValue` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `totalCommission` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `totalCommissionPercent` decimal(5,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `angariadorCommission` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `vendedorCommission` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `baggioCommission` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `expectedPaymentDate` timestamp;--> statement-breakpoint
ALTER TABLE `sales` ADD `storeAngariador` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `storeVendedor` varchar(255);