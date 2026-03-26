CREATE TABLE `users` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` text,
  `email` varchar(320),
  `passwordHash` varchar(255),
  `role` enum('user','admin','superadmin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `users_id` PRIMARY KEY(`id`)
);

CREATE TABLE `clients` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `cnpj` varchar(20),
  `email` varchar(320),
  `phone` varchar(50),
  `address` text,
  `origin` varchar(100),
  `status` enum('lead','ativo','inativo') NOT NULL DEFAULT 'ativo',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);

CREATE TABLE `contacts` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(100),
  `email` varchar(320),
  `phone` varchar(50),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

CREATE TABLE `pipeline` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientName` varchar(255) NOT NULL,
  `clientId` int,
  `value` decimal(12,2),
  `stage` enum('lead','contato','proposta','negociacao','ganho','perdido') NOT NULL DEFAULT 'lead',
  `probability` int DEFAULT 50,
  `expectedClose` varchar(10),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pipeline_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL
);

CREATE TABLE `projects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('em_andamento','pausado','concluido','cancelado') NOT NULL DEFAULT 'em_andamento',
  `value` decimal(12,2) DEFAULT '0',
  `hoursEstimated` decimal(8,2),
  `startDate` varchar(10),
  `deadline` varchar(10),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `projects_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL
);

CREATE TABLE `tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int,
  `title` varchar(255) NOT NULL,
  `description` text,
  `status` enum('todo','doing','review','done') NOT NULL DEFAULT 'todo',
  `priority` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
  `assignee` varchar(100),
  `deadline` varchar(10),
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);

CREATE TABLE `time_entries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int,
  `userId` int,
  `date` varchar(10) NOT NULL,
  `hours` decimal(6,2) NOT NULL,
  `description` text,
  `billable` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `time_entries_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

CREATE TABLE `proposals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int,
  `projectId` int,
  `title` varchar(255) NOT NULL,
  `items` text NOT NULL,
  `subtotal` decimal(12,2) DEFAULT '0',
  `discount` decimal(12,2) DEFAULT '0',
  `total` decimal(12,2) DEFAULT '0',
  `validityDays` int DEFAULT 15,
  `status` enum('rascunho','enviada','aprovada','recusada','vencida') NOT NULL DEFAULT 'rascunho',
  `notes` text,
  `sentAt` timestamp,
  `respondedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `proposals_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL
);

CREATE TABLE `invoices` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` int,
  `projectId` int,
  `proposalId` int,
  `description` varchar(255) NOT NULL,
  `value` decimal(12,2) NOT NULL,
  `status` enum('pendente','recebido','vencido','cancelado') NOT NULL DEFAULT 'pendente',
  `dueDate` varchar(10),
  `paidAt` varchar(10),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE SET NULL
);

CREATE TABLE `expenses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int,
  `description` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `value` decimal(12,2) NOT NULL,
  `date` varchar(10) NOT NULL,
  `paid` boolean NOT NULL DEFAULT true,
  `receipt` text,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `expenses_id` PRIMARY KEY(`id`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL
);

CREATE TABLE `password_reset_tokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `token` varchar(128) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `password_reset_tokens_id` PRIMARY KEY(`id`),
  CONSTRAINT `password_reset_tokens_token_unique` UNIQUE(`token`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
