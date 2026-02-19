CREATE TABLE `indicatorDetails` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`snapshotId` varchar(64),
	`indicatorName` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`relatedIds` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `indicatorDetails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `indicatorGoals` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`indicatorName` varchar(255) NOT NULL,
	`monthlyGoal` decimal(15,2),
	`annualAverage` decimal(15,2),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `indicatorGoals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `monthlyIndicatorsSnapshot` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`negociosValor` decimal(15,2),
	`negociosUnidades` int,
	`vendidosCancelados` int,
	`comissaoRecebida` decimal(15,2),
	`comissaoVendida` decimal(15,2),
	`comissaoPendente` decimal(15,2),
	`percentualComissaoVendida` decimal(5,2),
	`negociosAcima1M` int,
	`prazoMedioRecebimento` int,
	`percentualCanceladaPendente` decimal(5,2),
	`valorMedioImovel` decimal(15,2),
	`negociosRede` int,
	`negociosInternos` int,
	`negociosParceriaExterna` int,
	`negociosLancamentos` int,
	`carteiraAtiva` int,
	`angariacesMes` int,
	`baixasMes` int,
	`vsoVendaOferta` decimal(5,2),
	`atendimentosProntos` int,
	`atendimentosLancamentos` int,
	`despesaGeral` decimal(15,2),
	`despesaImpostos` decimal(15,2),
	`fundoInovacao` decimal(15,2),
	`resultadoSocios` decimal(15,2),
	`fundoEmergencial` decimal(15,2),
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monthlyIndicatorsSnapshot_id` PRIMARY KEY(`id`)
);
