"""Run the isBookmarked DB migration on VPS."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd

# Check DB credentials from ecosystem config
sql = "ALTER TABLE Journal ADD COLUMN IF NOT EXISTS isBookmarked TINYINT(1) NOT NULL DEFAULT 0;"
# Try root first, then common STICK db user
code = run_cmd(f'mysql -u root -proot stick_db -e "{sql}"', timeout=30)
if code != 0:
    print("Trying with stick user...")
    run_cmd(f'mysql -u stick -pstick stick_db -e "{sql}"', timeout=30)
