"""Upload and trigger frontend build on VPS."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import sftp_write, sftp_read, run_cmd

BUILD_SCRIPT = r"""$ErrorActionPreference = 'Continue'
$env:PATH = "C:/inetpub/wwwroot/stick/frontend/node_modules/.bin;C:/Program Files/nodejs;" + $env:PATH
"[BUILD STARTED] $(Get-Date)" | Out-File C:/stick_build.log -Encoding utf8

# Pull latest code
"[GIT PULL] $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8
Set-Location 'C:/inetpub/wwwroot/stick'
git pull origin main 2>&1 | Out-File C:/stick_build.log -Append -Encoding utf8
"[GIT DONE] Exit: $LASTEXITCODE $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8

# Stop backend so prisma can replace locked dll
"[PM2 STOP] $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8
pm2 stop stick-api-prod 2>&1 | Out-File C:/stick_build.log -Append -Encoding utf8

# Regenerate Prisma client
"[PRISMA GENERATE] $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8
Set-Location 'C:/inetpub/wwwroot/stick/backend'
& ./node_modules/.bin/prisma.cmd generate 2>&1 | Out-File C:/stick_build.log -Append -Encoding utf8
"[PRISMA DONE] Exit: $LASTEXITCODE $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8

# Restart backend
"[PM2 START] $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8
pm2 start stick-api-prod 2>&1 | Out-File C:/stick_build.log -Append -Encoding utf8
"[PM2 DONE] Exit: $LASTEXITCODE $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8

# Build frontend
Set-Location 'C:/inetpub/wwwroot/stick/frontend'
node 'C:/inetpub/wwwroot/stick/frontend/node_modules/vite/bin/vite.js' build 2>&1 | Out-File C:/stick_build.log -Append -Encoding utf8
"[BUILD DONE] Exit: $LASTEXITCODE $(Get-Date)" | Out-File C:/stick_build.log -Append -Encoding utf8
"""

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "upload"

    if action == "upload":
        sftp_write('C:/stick_build.ps1', BUILD_SCRIPT)
        print("Script uploaded. Run: python _vps_build.py run")

    elif action == "run":
        # Launch build in background via Task Scheduler or schtasks
        cmd = r'schtasks /Create /TN "StickBuild" /TR "powershell -NonInteractive -File C:\stick_build.ps1" /SC ONCE /ST 00:00 /F /RL HIGHEST'
        run_cmd(cmd, timeout=15)
        run_cmd('schtasks /Run /TN "StickBuild"', timeout=15)
        print("Build task triggered. Run: python _vps_build.py log (after 2-3 min)")

    elif action == "log":
        try:
            content = sftp_read('C:/stick_build.log')
            print(content)
        except Exception as e:
            print(f"Log not found yet: {e}")

    elif action == "check":
        run_cmd("powershell \"(Get-Item 'C:/inetpub/wwwroot/stick/frontend/dist/index.html').LastWriteTime\"", timeout=15)
