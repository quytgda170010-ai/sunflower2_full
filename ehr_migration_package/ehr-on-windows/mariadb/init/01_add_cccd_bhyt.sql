-- Migration: Add cccd and bhyt columns to ehr_patients table
-- Date: 2025-11-25
-- This migration will run automatically when MariaDB container starts

USE ehr_core;

-- Check if columns already exist before adding
SET @dbname = DATABASE();
SET @tablename = "ehr_patients";
SET @columnname1 = "cccd";
SET @columnname2 = "bhyt";

-- Check if cccd column exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname1)
  ) > 0,
  "SELECT 'Column cccd already exists' AS result;",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @columnname1, "` VARCHAR(12) DEFAULT NULL COMMENT 'Căn cước công dân (12 số)' AFTER `address`;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check if bhyt column exists
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname2)
  ) > 0,
  "SELECT 'Column bhyt already exists' AS result;",
  CONCAT("ALTER TABLE `", @tablename, "` ADD COLUMN `", @columnname2, "` VARCHAR(15) DEFAULT NULL COMMENT 'Bảo hiểm y tế (10 số mẫu mới hoặc 15 số mẫu cũ)' AFTER `cccd`;")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add unique index on cccd if it doesn't exist
SET @indexname = "unique_cccd";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 'Index unique_cccd already exists' AS result;",
  CONCAT("ALTER TABLE `", @tablename, "` ADD UNIQUE KEY `", @indexname, "` (`cccd`);")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index on bhyt if it doesn't exist
SET @indexname = "idx_bhyt";
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (index_name = @indexname)
  ) > 0,
  "SELECT 'Index idx_bhyt already exists' AS result;",
  CONCAT("ALTER TABLE `", @tablename, "` ADD KEY `", @indexname, "` (`bhyt`);")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;




