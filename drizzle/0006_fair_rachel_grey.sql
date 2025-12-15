CREATE TABLE `actionLogs` (
	`id` varchar(64) NOT NULL,
	`companyId` varchar(64),
	`userId` varchar(64) NOT NULL,
	`targetType` enum('user','company','sale','commission','license') NOT NULL,
	`targetId` varchar(64),
	`action` enum('create','update','delete','activate','deactivate','login') NOT NULL,
	`details` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `actionLogs_id` PRIMARY KEY(`id`)
);
