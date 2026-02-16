ALTER TABLE `sales` ADD `sinalNegocio` enum('Baggio','Outra');--> statement-breakpoint
ALTER TABLE `sales` ADD `sinalNegocioEmpresa` varchar(255);--> statement-breakpoint
ALTER TABLE `sales` ADD `sinalNegocioValor` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `sinalNegocioDataPagamento` timestamp;--> statement-breakpoint
ALTER TABLE `sales` ADD `sinalNegocioComprovanteUrl` text;