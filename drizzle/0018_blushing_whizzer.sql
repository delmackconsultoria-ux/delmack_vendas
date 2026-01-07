CREATE TABLE `goals` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64) NOT NULL,
	`year` int NOT NULL,
	`month` int NOT NULL,
	`teamGoal` decimal(15,2) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
