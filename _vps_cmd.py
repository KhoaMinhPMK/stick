"""Minimal SSH command runner for STICK VPS deployment."""
import sys
import paramiko

HOST = "160.30.113.26"
PORT = 22
USER = "Administrator"
PASS = "mWm8mY5KUawr"

def run_cmd(cmd, timeout=60):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    client.close()
    if out:
        print(out)
    if err:
        print("[STDERR]", err)
    print(f"[EXIT CODE: {code}]")
    return code

if __name__ == "__main__":
    cmd = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "echo connected"
    run_cmd(cmd)
