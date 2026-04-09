"""Read VPS .env to find DB credentials, then run migration."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd, sftp_read

# Read .env file
try:
    content = sftp_read('C:/inetpub/wwwroot/stick/backend/.env')
    print("=== .env contents ===")
    for line in content.splitlines():
        if 'DATABASE' in line or 'DB_' in line or 'MYSQL' in line:
            print(line)
except Exception as e:
    print(f"Could not read .env: {e}")
    # Try listing dir
    run_cmd('dir C:\\inetpub\\wwwroot\\stick\\backend\\.env', timeout=10)
