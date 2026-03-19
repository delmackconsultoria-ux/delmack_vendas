CREATE TABLE `indicatorManualData` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`despesaGeral` decimal(15,2) DEFAULT '0',
	`despesaImpostos` decimal(15,2) DEFAULT '0',
	`fundoInovacao` decimal(15,2) DEFAULT '0',
	`resultadoSocios` decimal(15,2) DEFAULT '0',
	`fundoEmergencial` decimal(15,2) DEFAULT '0',
	`updatedBy` varchar(64) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `indicatorManualData_id` PRIMARY KEY(`id`)
);
