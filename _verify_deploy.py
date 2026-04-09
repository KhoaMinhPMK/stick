"""Verify isBookmarked column exists and check build log."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd, sftp_read

print("=== Checking isBookmarked column ===")
run_cmd('mysql -u stick_user "-pStickApp2026!" stick_db -e "DESCRIBE Journal"', timeout=15)

print("\n=== Build log (last 30 lines) ===")
try:
    log = sftp_read('C:/stick_build.log')
    lines = log.strip().splitlines()
    print('\n'.join(lines[-30:]))
except Exception as e:
    print(f"Could not read log: {e}")
