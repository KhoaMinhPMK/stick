"""Run DB migrations on VPS."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd, sftp_write

# Upload migration SQL
sql = open('e:/project/stick/backend/prisma/migrations/20260410_tts_cache.sql').read()
sftp_write('C:/stick_migrate_tts.sql', sql)

# Execute migration
sql_inline = (
    "CREATE TABLE IF NOT EXISTS `TtsCache` ("
    "`id` VARCHAR(36) NOT NULL,"
    "`textHash` VARCHAR(64) NOT NULL,"
    "`voice` VARCHAR(20) NOT NULL DEFAULT 'nova',"
    "`audioBase64` MEDIUMTEXT NOT NULL,"
    "`createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),"
    "PRIMARY KEY (`id`),"
    "UNIQUE KEY `TtsCache_textHash_voice_key` (`textHash`,`voice`),"
    "KEY `TtsCache_textHash_idx` (`textHash`)"
    ") DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
)
code = run_cmd(
    f'mysql -u stick_user "-pStickApp2026!" stick_db -e "{sql_inline}"', timeout=30
)
print(f"Migration exit: {code}")

