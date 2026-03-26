-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 0002 — Auth Security
-- Run AFTER 0001_init.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Expand users table with security fields
ALTER TABLE `users`
  MODIFY COLUMN `role` enum('viewer','member','admin','superadmin') NOT NULL DEFAULT 'member',
  ADD COLUMN `status` enum('pending','active','suspended') NOT NULL DEFAULT 'pending' AFTER `role`,
  ADD COLUMN `failedLoginCount` int NOT NULL DEFAULT 0 AFTER `status`,
  ADD COLUMN `lockedUntil` timestamp NULL AFTER `failedLoginCount`,
  ADD COLUMN `lastLoginAt` timestamp NULL AFTER `lockedUntil`,
  ADD COLUMN `lastLoginIp` varchar(45) NULL AFTER `lastLoginAt`,
  ADD COLUMN `passwordChangedAt` timestamp NULL AFTER `lastLoginIp`,
  ADD COLUMN `invitedById` int NULL AFTER `passwordChangedAt`,
  ADD UNIQUE INDEX `users_email_unique` (`email`);

-- Activate existing users so they don't get locked out
UPDATE `users` SET `status` = 'active' WHERE `status` = 'pending';

-- ─── Invite tokens ────────────────────────────────────────────────────────────
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
  CONSTRAINT `invite_tokens_pk` PRIMARY KEY(`id`),
  CONSTRAINT `invite_tokens_token_unique` UNIQUE(`token`),
  FOREIGN KEY (`invitedById`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ─── Server-side sessions ─────────────────────────────────────────────────────
CREATE TABLE `sessions` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `userId`      int NOT NULL,
  `tokenHash`   varchar(128) NOT NULL,
  `ipAddress`   varchar(45) NULL,
  `userAgent`   varchar(512) NULL,
  `expiresAt`   timestamp NOT NULL,
  `revokedAt`   timestamp NULL,
  `createdAt`   timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `sessions_pk` PRIMARY KEY(`id`),
  CONSTRAINT `sessions_tokenHash_unique` UNIQUE(`tokenHash`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ─── Password reset tokens ────────────────────────────────────────────────────
-- (replaces old table if it exists)
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `userId`      int NOT NULL,
  `token`       varchar(128) NOT NULL,
  `expiresAt`   timestamp NOT NULL,
  `usedAt`      timestamp NULL,
  `ipAddress`   varchar(45) NULL,
  `createdAt`   timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `prt_pk` PRIMARY KEY(`id`),
  CONSTRAINT `prt_token_unique` UNIQUE(`token`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- ─── Audit log ────────────────────────────────────────────────────────────────
CREATE TABLE `audit_log` (
  `id`          int AUTO_INCREMENT NOT NULL,
  `userId`      int NULL,
  `action`      varchar(100) NOT NULL,
  `entity`      varchar(100) NULL,
  `entityId`    int NULL,
  `detail`      text NULL,
  `ipAddress`   varchar(45) NULL,
  `userAgent`   varchar(512) NULL,
  `createdAt`   timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `audit_log_pk` PRIMARY KEY(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
);

-- Useful indexes
CREATE INDEX `idx_sessions_userId` ON `sessions`(`userId`);
CREATE INDEX `idx_audit_userId` ON `audit_log`(`userId`);
CREATE INDEX `idx_audit_action` ON `audit_log`(`action`);
CREATE INDEX `idx_invite_email` ON `invite_tokens`(`email`);
