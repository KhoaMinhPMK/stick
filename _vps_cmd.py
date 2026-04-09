"""Minimal SSH command runner for STICK VPS deployment."""
import sys
import io
import threading
import paramiko

HOST = "160.30.113.26"
PORT = 22
USER = "Administrator"
PASS = "mWm8mY5KUawr"

def _connect():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, port=PORT, username=USER, password=PASS, timeout=15)
    return client

def run_cmd(cmd, timeout=60):
    client = _connect()
    stdin, stdout, stderr = client.exec_command(cmd)
    # Read both streams concurrently to prevent deadlock when stderr buffer fills
    out_buf = []
    err_buf = []
    def _r(stream, buf):
        buf.append(stream.read())
    t1 = threading.Thread(target=_r, args=(stdout, out_buf))
    t2 = threading.Thread(target=_r, args=(stderr, err_buf))
    t1.start(); t2.start()
    t1.join(timeout=timeout); t2.join(timeout=timeout)
    code = stdout.channel.recv_exit_status()
    client.close()
    out = (out_buf[0] if out_buf else b"").decode("utf-8", errors="replace")
    err = (err_buf[0] if err_buf else b"").decode("utf-8", errors="replace")
    if out:
        print(out)
    if err:
        print("[STDERR]", err)
    print(f"[EXIT CODE: {code}]")
    return code

def sftp_write(remote_path, content: str):
    """Write a text file to the VPS via SFTP."""
    client = _connect()
    sftp = client.open_sftp()
    with sftp.open(remote_path, "w") as f:
        f.write(content)
    sftp.close()
    client.close()
    print(f"[SFTP] Written: {remote_path}")

def sftp_read(remote_path) -> str:
    """Read a text file from the VPS via SFTP."""
    client = _connect()
    sftp = client.open_sftp()
    with sftp.open(remote_path, "r") as f:
        data = f.read()
    sftp.close()
    client.close()
    return data.decode("utf-8", errors="replace") if isinstance(data, bytes) else data

if __name__ == "__main__":
    args = sys.argv[1:]
    t = 60
    if len(args) >= 2 and args[-1].isdigit():
        t = int(args.pop())
    cmd = " ".join(args) if args else "echo connected"
    run_cmd(cmd, timeout=t)
