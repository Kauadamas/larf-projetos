-- =============================================================================
-- LARF Projetos — Schema inicial completo
-- Substitui os arquivos 0001_init.sql e 0002_auth_security.sql antigos.
-- Execute UMA VEZ em um banco MySQL limpo.
-- =============================================================================

-- ─── Users ───────────────────────────────────────────────────────────────────
CREATE TABLE `users` (
  `id`                int AUTO_INCREMENT NOT NULL,
  `name`              text,
  `email`             varchar(320) UNIQUE,
  `passwordHash`      varchar(255),
  `role`              enum('viewer','member','admin','superadmin') NOT NULL DEFAULT 'member',
  `status`            enum('pending','active','suspended') NOT NULL DEFAULT 'pending',
  `failedLoginCount`  int NOT NULL DEFAULT 0,
  `lockedUntil`       timestamp NULL,
  `lastLoginAt`       timestamp NULL,
  `lastLoginIp`       varchar(45) NULL,
  `passwordChangedAt` timestamp NULL,
  `invitedById`       int NULL,
  `createdAt`         timestamp NOT NULL DEFAULT (now()),
  `updatedAt`         timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `users_pk` PRIMARY KEY (`id`)
);

-- ─── Invite Tokens ────────────────────────────────────────────────────────────
CREATE TABLE `invite_tokens` (
  `id`           int AUTO_INCREMENT NOT NULL,
  `token`        varchar(128) NOT NULL,
  `email`        varchar(320) NOT NULL,
  `role`         enum('viewer','member','admin') NOT NULL DEFAULT 'member',
  `invitedById`  int NOT NULL,
  `expiresAt`    timestamp NOT NULL,
  `usedAt`       timestamp NULL,
  `usedByUserId` int NULL,
  `createdAt`    timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `invite_tokens_pk` PRIMARY KEY (`id`),
  CONSTRAINT `invite_tokens_token_unique` UNIQUE (`token`),
  FOREIGN KEY (`invitedById`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ─── Sessions (server-side — permite revogação) ───────────────────────────────
CREATE TABLE `sessions` (
  `id`        int AUTO_INCREMENT NOT NULL,
  `userId`    int NOT NULL,
  `tokenHash` varchar(128) NOT NULL,
  `ipAddress` varchar(45) NULL,
  `userAgent` varchar(512) NULL,
  `expiresAt` timestamp NOT NULL,
  `revokedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `sessions_pk` PRIMARY KEY (`id`),
  CONSTRAINT `sessions_tokenHash_unique` UNIQUE (`tokenHash`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ─── Password Reset Tokens ────────────────────────────────────────────────────
CREATE TABLE `password_reset_tokens` (
  `id`        int AUTO_INCREMENT NOT NULL,
  `userId`    int NOT NULL,
  `token`     varchar(128) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt`    timestamp NULL,
  `ipAddress` varchar(45) NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `prt_pk` PRIMARY KEY (`id`),
  CONSTRAINT `prt_token_unique` UNIQUE (`token`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ─── Audit Log ────────────────────────────────────────────────────────────────
CREATE TABLE `audit_log` (
  `id`        int AUTO_INCREMENT NOT NULL,
  `userId`    int NULL,
  `action`    varchar(100) NOT NULL,
  `entity`    varchar(100) NULL,
  `entityId`  int NULL,
  `detail`    text NULL,
  `ipAddress` varchar(45) NULL,
  `userAgent` varchar(512) NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `audit_log_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- ─── Clients ──────────────────────────────────────────────────────────────────
CREATE TABLE `clients` (
  `id`        int AUTO_INCREMENT NOT NULL,
  `name`      varchar(255) NOT NULL,
  `cnpj`      varchar(20),
  `email`     varchar(320),
  `phone`     varchar(50),
  `address`   text,
  `origin`    varchar(100),
  `status`    enum('lead','ativo','inativo') NOT NULL DEFAULT 'ativo',
  `notes`     text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `clients_pk` PRIMARY KEY (`id`)
);

-- ─── Contacts ─────────────────────────────────────────────────────────────────
CREATE TABLE `contacts` (
  `id`        int AUTO_INCREMENT NOT NULL,
  `clientId`  int NOT NULL,
  `name`      varchar(255) NOT NULL,
  `role`      varchar(100),
  `email`     varchar(320),
  `phone`     varchar(50),
  `notes`     text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `contacts_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE
);

-- ─── Pipeline ─────────────────────────────────────────────────────────────────
CREATE TABLE `pipeline` (
  `id`            int AUTO_INCREMENT NOT NULL,
  `clientName`    varchar(255) NOT NULL,
  `clientId`      int NULL,
  `value`         decimal(12,2),
  `stage`         enum('lead','contato','proposta','negociacao','ganho','perdido') NOT NULL DEFAULT 'lead',
  `probability`   int DEFAULT 50,
  `expectedClose` varchar(10),
  `notes`         text,
  `createdAt`     timestamp NOT NULL DEFAULT (now()),
  `updatedAt`     timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `pipeline_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL
);

-- ─── Projects ─────────────────────────────────────────────────────────────────
CREATE TABLE `projects` (
  `id`             int AUTO_INCREMENT NOT NULL,
  `clientId`       int NULL,
  `title`          varchar(255) NOT NULL,
  `description`    text,
  `status`         enum('em_andamento','pausado','concluido','cancelado') NOT NULL DEFAULT 'em_andamento',
  `value`          decimal(12,2) DEFAULT '0',
  `hoursEstimated` decimal(8,2),
  `startDate`      varchar(10),
  `deadline`       varchar(10),
  `createdAt`      timestamp NOT NULL DEFAULT (now()),
  `updatedAt`      timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `projects_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL
);

-- ─── Tasks ────────────────────────────────────────────────────────────────────
CREATE TABLE `tasks` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `projectId`   int NULL,
  `title`       varchar(255) NOT NULL,
  `description` text,
  `status`      enum('todo','doing','review','done') NOT NULL DEFAULT 'todo',
  `priority`    enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
  `assignee`    varchar(100),
  `deadline`    varchar(10),
  `sortOrder`   int NOT NULL DEFAULT 0,
  `createdAt`   timestamp NOT NULL DEFAULT (now()),
  `updatedAt`   timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tasks_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE
);

-- ─── Time Entries ─────────────────────────────────────────────────────────────
CREATE TABLE `time_entries` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `projectId`   int NULL,
  `userId`      int NULL,
  `date`        varchar(10) NOT NULL,
  `hours`       decimal(6,2) NOT NULL,
  `description` text,
  `billable`    boolean NOT NULL DEFAULT true,
  `createdAt`   timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `time_entries_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- ─── Proposals ────────────────────────────────────────────────────────────────
CREATE TABLE `proposals` (
  `id`           int AUTO_INCREMENT NOT NULL,
  `clientId`     int NULL,
  `projectId`    int NULL,
  `title`        varchar(255) NOT NULL,
  `items`        text NOT NULL DEFAULT '[]',
  `subtotal`     decimal(12,2) DEFAULT '0',
  `discount`     decimal(12,2) DEFAULT '0',
  `total`        decimal(12,2) DEFAULT '0',
  `validityDays` int DEFAULT 15,
  `status`       enum('rascunho','enviada','aprovada','recusada','vencida') NOT NULL DEFAULT 'rascunho',
  `notes`        text,
  `sentAt`       timestamp NULL,
  `respondedAt`  timestamp NULL,
  `createdAt`    timestamp NOT NULL DEFAULT (now()),
  `updatedAt`    timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `proposals_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL
);

-- ─── Invoices ─────────────────────────────────────────────────────────────────
CREATE TABLE `invoices` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `clientId`    int NULL,
  `projectId`   int NULL,
  `proposalId`  int NULL,
  `description` varchar(255) NOT NULL,
  `value`       decimal(12,2) NOT NULL,
  `status`      enum('pendente','recebido','vencido','cancelado') NOT NULL DEFAULT 'pendente',
  `dueDate`     varchar(10),
  `paidAt`      varchar(10),
  `notes`       text,
  `createdAt`   timestamp NOT NULL DEFAULT (now()),
  `updatedAt`   timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `invoices_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`proposalId`) REFERENCES `proposals`(`id`) ON DELETE SET NULL
);

-- ─── Expenses ─────────────────────────────────────────────────────────────────
CREATE TABLE `expenses` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `projectId`   int NULL,
  `description` varchar(255) NOT NULL,
  `category`    varchar(100) NOT NULL,
  `value`       decimal(12,2) NOT NULL,
  `date`        varchar(10) NOT NULL,
  `paid`        boolean NOT NULL DEFAULT true,
  `receipt`     text,
  `notes`       text,
  `createdAt`   timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `expenses_pk` PRIMARY KEY (`id`),
  FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE SET NULL
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX `idx_sessions_userId`   ON `sessions`(`userId`);
CREATE INDEX `idx_sessions_expires`  ON `sessions`(`expiresAt`);
CREATE INDEX `idx_audit_userId`      ON `audit_log`(`userId`);
CREATE INDEX `idx_audit_action`      ON `audit_log`(`action`);
CREATE INDEX `idx_invite_email`      ON `invite_tokens`(`email`);
CREATE INDEX `idx_invite_expires`    ON `invite_tokens`(`expiresAt`);
CREATE INDEX `idx_tasks_projectId`   ON `tasks`(`projectId`);
CREATE INDEX `idx_time_projectId`    ON `time_entries`(`projectId`);
CREATE INDEX `idx_time_userId`       ON `time_entries`(`userId`);
