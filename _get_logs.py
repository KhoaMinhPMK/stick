import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd, sftp_read

# Get PM2 logs
run_cmd('pm2 logs stick-api-prod --lines 80 --nostream', timeout=30)
