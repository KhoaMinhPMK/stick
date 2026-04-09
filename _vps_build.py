"""Upload and trigger frontend build on VPS."""
import sys
sys.path.insert(0, 'e:/project/stick')
from _vps_cmd import sftp_write, sftp_read, run_cmd

BUILD_SCRIPT = r"""$ErrorActionPreference = 'Continue'
$env:PATH = "C:/inetpub/wwwroot/stick/frontend/node_modules/.bin;C:/Program Files/nodejs;" + $env:PATH
Set-Location 'C:/inetpub/wwwroot/stick/frontend'
"[BUILD STARTED] $(Get-Date)" | Out-File C:/stick_build.log -Encoding utf8
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
