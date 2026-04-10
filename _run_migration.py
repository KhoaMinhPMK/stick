"""Run DB migrations on VPS."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd, sftp_write

# Upload config fix SQL
sql = open('e:/project/stick/backend/prisma/migrations/20260410_fix_admin_config_values.sql').read()
sftp_write('C:/stick_migrate_config.sql', sql)

# Execute migration
sql_statements = [
    "UPDATE `AppConfig` SET `value`='gpt-4.1', `updatedAt`=NOW() WHERE `key`='ai_model';",
    "UPDATE `AppConfig` SET `value`='2500', `updatedAt`=NOW() WHERE `key`='ai_max_tokens';",
    "UPDATE `AppConfig` SET `key`='ai_tutor_style', `value`='You are a warm, encouraging English tutor for the STICK app.', `updatedAt`=NOW() WHERE `key`='ai_system_prompt';",
    "UPDATE `AppConfig` SET `value`='0.3', `updatedAt`=NOW() WHERE `key`='ai_temperature';",
]
for stmt in sql_statements:
    code = run_cmd(
        f'mysql -u stick_user "-pStickApp2026!" stick_db -e "{stmt}"', timeout=30
    )
    print(f"Statement exit: {code} | {stmt[:60]}...")

