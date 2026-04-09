"""Run isBookmarked migration on VPS MySQL via file."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd, sftp_write

sql = """
SET @dbname = DATABASE();
SET @have = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='Journal' AND COLUMN_NAME='isBookmarked');
SET @sql = IF(@have > 0, 'SELECT 1', 'ALTER TABLE Journal ADD COLUMN isBookmarked TINYINT(1) NOT NULL DEFAULT 0');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
"""

sftp_write('C:/stick_migration.sql', sql)
run_cmd('mysql -u stick_user "-pStickApp2026!" stick_db < C:\\stick_migration.sql', timeout=30)
