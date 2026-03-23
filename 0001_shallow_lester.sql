CREATE TABLE `businesses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`googleMapsLink` text,
	`placeId` varchar(255),
	`address` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businesses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `execution_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`accountEmail` varchar(320),
	`businessName` varchar(500),
	`reviewContent` text,
	`starRating` int,
	`status` enum('success','failed','skipped') NOT NULL,
	`errorMessage` text,
	`stepReached` varchar(100),
	`executionTimeMs` int,
	`screenshotUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `execution_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `google_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`password` text NOT NULL,
	`backupCodes` json,
	`displayName` varchar(255),
	`status` enum('available','in_use','invalid','cooldown') NOT NULL DEFAULT 'available',
	`lastUsedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `google_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountId` int NOT NULL,
	`businessId` int NOT NULL,
	`templateId` int,
	`reviewContent` text,
	`starRating` int NOT NULL DEFAULT 5,
	`reviewType` enum('positive','negative') NOT NULL DEFAULT 'positive',
	`status` enum('pending','in_progress','completed','failed','cancelled','paused') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `review_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`type` enum('positive','negative') NOT NULL DEFAULT 'positive',
	`starRating` int NOT NULL DEFAULT 5,
	`language` varchar(10) DEFAULT 'zh-HK',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `review_templates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedule_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`isEnabled` boolean NOT NULL DEFAULT false,
	`executionTime` varchar(5) DEFAULT '10:00',
	`maxTasksPerDay` int NOT NULL DEFAULT 5,
	`minDelayMinutes` int NOT NULL DEFAULT 30,
	`maxDelayMinutes` int NOT NULL DEFAULT 120,
	`timezone` varchar(50) DEFAULT 'Asia/Hong_Kong',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedule_configs_id` PRIMARY KEY(`id`)
);
