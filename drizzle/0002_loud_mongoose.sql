CREATE TABLE `bonuses` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`bonusValue` decimal(15,2),
	`bonusPercentage` decimal(5,2),
	`type` enum('bonificacao','premio','outro') NOT NULL,
	`linkedTo` enum('referencia','equipe','meta','nenhum') DEFAULT 'nenhum',
	`linkedValue` varchar(255),
	`applicableTo` varchar(255),
	`startDate` timestamp,
	`endDate` timestamp,
	`isActive` boolean DEFAULT true,
	`createdBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bonuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissionApprovals` (
	`id` varchar(64) NOT NULL,
	`commissionId` varchar(64) NOT NULL,
	`saleId` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`status` enum('proposta','enviado_gerente','aprovado_gerente','enviado_financeiro','aprovado_financeiro','recusado','pago') NOT NULL DEFAULT 'proposta',
	`sentToManagerAt` timestamp,
	`approvedByManagerAt` timestamp,
	`approvedByManagerId` varchar(64),
	`sentToFinanceAt` timestamp,
	`approvedByFinanceAt` timestamp,
	`approvedByFinanceId` varchar(64),
	`paidAt` timestamp,
	`rejectionReason` text,
	`rejectedAt` timestamp,
	`rejectedBy` varchar(64),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commissionApprovals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commissionHistory` (
	`id` varchar(64) NOT NULL,
	`commissionId` varchar(64) NOT NULL,
	`previousValue` decimal(15,2),
	`newValue` decimal(15,2) NOT NULL,
	`previousStatus` varchar(64),
	`newStatus` varchar(64) NOT NULL,
	`changedBy` varchar(64) NOT NULL,
	`approvedBy` varchar(64),
	`approvalDate` timestamp,
	`reason` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `commissionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `models` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64),
	`modelType` enum('paymentMethod','clientOrigin','carteiraSituation','teamType','rejectionReason','businessType') NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `models_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `propertyHistory` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`propertyReference` varchar(64) NOT NULL,
	`previousValue` decimal(15,2),
	`newValue` decimal(15,2),
	`previousStatus` varchar(255),
	`newStatus` varchar(255),
	`reason` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `propertyHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`propertyReference` varchar(64) NOT NULL,
	`brokerAngariadorId` varchar(64) NOT NULL,
	`status` enum('proposta','vendido','recusado','outro') NOT NULL DEFAULT 'proposta',
	`customStatus` varchar(255),
	`rejectionReason` varchar(255),
	`rejectionDate` timestamp,
	`rejectionObservation` text,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `proposals_id` PRIMARY KEY(`id`)
);
