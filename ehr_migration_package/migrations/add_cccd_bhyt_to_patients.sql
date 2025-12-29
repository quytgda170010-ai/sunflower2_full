-- Migration: Add cccd and bhyt columns to ehr_patients table
-- Date: 2025-11-25

USE ehr_core;

-- Add cccd column (Căn cước công dân - 12 digits)
ALTER TABLE `ehr_patients` 
ADD COLUMN `cccd` VARCHAR(12) DEFAULT NULL COMMENT 'Căn cước công dân (12 số)' AFTER `address`;

-- Add bhyt column (Bảo hiểm y tế - 10 or 15 digits)
ALTER TABLE `ehr_patients` 
ADD COLUMN `bhyt` VARCHAR(15) DEFAULT NULL COMMENT 'Bảo hiểm y tế (10 số mẫu mới hoặc 15 số mẫu cũ)' AFTER `cccd`;

-- Add unique index on cccd to prevent duplicates
ALTER TABLE `ehr_patients` 
ADD UNIQUE KEY `unique_cccd` (`cccd`);

-- Add index on bhyt for faster searches
ALTER TABLE `ehr_patients` 
ADD KEY `idx_bhyt` (`bhyt`);






