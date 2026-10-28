"""
GoldLens — Application Launcher & Health Verifier
Starts the full-stack server if not running, polls until healthy, and opens default browser.
"""

import sys
import os
import time
import socket
import subprocess
import urllib.request
import webbrowser

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
TARGET_URL = "http://127.0.0.1:8000/"
HEALTH_URL = "http://127.0.0.1:8000/api/status"

def is_port_open(host: str = "127.0.0.1", port: int = 8000) -> bool:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(0.8)
    try:
        s.connect((host, port))
        s.close()
        return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False

def is_service_healthy(url: str = HEALTH_URL) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "GoldLens-Launcher/1.0"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False

def start_backend():
    print("[*] Launching GoldLens backend server on http://127.0.0.1:8000 ...")
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "main:app",
        "--app-dir",
        BACKEND_DIR,
        "--host",
        "127.0.0.1",
        "--port",
        "8000"
    ]
    flags = 0
    if os.name == "nt":
        # CREATE_NEW_CONSOLE gives the server process its own independent console window
        flags = subprocess.CREATE_NEW_CONSOLE

    proc = subprocess.Popen(
        cmd,
        cwd=BACKEND_DIR,
        creationflags=flags
    )
    return proc

def main():
    print("=" * 75)
    print("  GoldLens — Commodity Derivatives Intelligence Platform")
    print("  Full-Stack Application Launcher")
    print("=" * 75)
    print()

    # Step 1: Check if already running
    if is_port_open(port=8000):
        print("[*] Port 8000 is active. Checking service health...")
        if is_service_healthy():
            print("[OK] Backend is already running and HEALTHY (HTTP 200).")
        else:
            print("[*] Service is responding on port 8000. Waiting for initialization...")
    else:
        start_backend()

    # Step 2: Poll until service returns HTTP 200
    print("[*] Waiting for backend readiness and analytical data ingestion...")
    max_retries = 20
    is_ready = False
    for attempt in range(1, max_retries + 1):
        if is_service_healthy():
            is_ready = True
            break
        time.sleep(0.8)
        print(f"    Waiting for service to become ready (attempt {attempt}/{max_retries})...")

    if is_ready:
        print("[OK] Application is confirmed HEALTHY and ready!")
    else:
        print("[WARNING] Health check timed out. Attempting to open browser anyway...")

    # Step 3: Open default browser
    print(f"[*] Opening {TARGET_URL} in your default Windows browser...")
    try:
        # Standard reliable Windows default browser launch
        if os.name == "nt":
            os.system(f'start "" "{TARGET_URL}"')
        else:
            webbrowser.open(TARGET_URL)
    except Exception as e:
        print(f"[*] Falling back to webbrowser.open: {e}")
        webbrowser.open(TARGET_URL)

    print()
    print("=" * 75)
    print(f"  GoldLens is active at: {TARGET_URL}")
    print(f"  Interactive API Docs: {TARGET_URL}docs")
    print("  To stop services anytime, run: Stop_GoldLens.bat")
    print("=" * 75)
    print()

if __name__ == "__main__":
    main()
