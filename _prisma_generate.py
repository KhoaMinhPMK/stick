"""Run prisma generate on VPS to include TtsCache model."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import run_cmd

run_cmd(
    'powershell -NonInteractive -c "Set-Location C:/inetpub/wwwroot/stick/backend; & ./node_modules/.bin/prisma.cmd generate 2>&1"',
    timeout=90
)
