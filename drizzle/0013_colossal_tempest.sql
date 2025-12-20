ALTER TABLE `companies` ADD `cnpj` varchar(20);--> statement-breakpoint
ALTER TABLE `companies` ADD CONSTRAINT `companies_cnpj_unique` UNIQUE(`cnpj`);