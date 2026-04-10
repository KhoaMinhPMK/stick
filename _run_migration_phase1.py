"""Run Phase 1 migration: RewardEngine tables + GameConfig seeds."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd, sftp_write

# Read migration SQL
with open('e:/project/stick/backend/prisma/migrations/20260410_reward_rank_premium_abuse.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

action = sys.argv[1] if len(sys.argv) > 1 else "upload"

if action == "upload":
    sftp_write('C:/stick_phase1_migration.sql', sql)
    print("Migration SQL uploaded to VPS.")
    print("Run: python _run_migration_phase1.py run")

elif action == "run":
    sftp_write('C:/stick_phase1_migration.sql', sql)
    print("SQL uploaded. Executing migration...")
    code = run_cmd(
        'mysql -u stick_user "-pStickApp2026!" stick_db < C:\\stick_phase1_migration.sql',
        timeout=60
    )
    if code == 0:
        print("\n=== Migration successful ===")
        print("Now run: python _vps_build.py upload && python _vps_build.py run")
    else:
        print(f"\n=== Migration FAILED (exit code {code}) ===")

elif action == "verify":
    # Check tables exist
    tables = [
        'RewardLedger', 'RankLedger', 'DailyUserAggregate',
        'WeeklyUserAggregate', 'LeaderboardSnapshot', 'PremiumGrant',
        'AbuseFlag', 'GameConfig', 'PremiumPopupEvent'
    ]
    for t in tables:
        run_cmd(
            f'mysql -u stick_user "-pStickApp2026!" stick_db -e "SELECT COUNT(*) AS cnt FROM `{t}`"',
            timeout=15
        )
    # Check User columns
    run_cmd(
        'mysql -u stick_user "-pStickApp2026!" stick_db -e "SELECT eligibleForRank, totalRankedScore, accountTrustLevel FROM User LIMIT 1"',
        timeout=15
    )
    # Check GameConfig seed count
    run_cmd(
        'mysql -u stick_user "-pStickApp2026!" stick_db -e "SELECT COUNT(*) AS config_count FROM GameConfig"',
        timeout=15
    )
