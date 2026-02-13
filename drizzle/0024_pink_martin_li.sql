ALTER TABLE `sales` ADD `tipoComissao` enum('Venda Interna','Parceria UNA','Parceria Externa','Lançamento');--> statement-breakpoint
ALTER TABLE `sales` ADD `porcentagemComissao` decimal(5,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoTotal` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoAngariador` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoCoordenador` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoVendedor` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoImobiliaria` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoParceira` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoAutonomo` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `possuiBonificacao` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `sales` ADD `tipoBonificacao` enum('Dinheiro','Material');--> statement-breakpoint
ALTER TABLE `sales` ADD `valorBonificacao` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `descricaoBonificacao` text;--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoBonificacaoCorretor` decimal(15,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `comissaoBonificacaoImobiliaria` decimal(15,2);