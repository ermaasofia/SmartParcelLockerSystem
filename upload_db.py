"""Upload local pickngo_v2.db to Fly.io /data/ via SSH.
Uses chunked base64 transfer through fly ssh console.
Handles auto-stop by restarting the machine.
"""
import subprocess, base64, time, sys

DB_PATH = "pickngo_v2_upload.db"
REMOTE_PATH = "/data/pickngo_v2.db"
APP = "pick-n-go"
MACHINE_ID = "48ed195c419e78"
CHUNK_SIZE = 8000  # base64 chars per chunk

def ensure_machine_running():
    """Start the machine if it's not running."""
    result = subprocess.run(
        ["fly", "machine", "start", MACHINE_ID, "-a", APP],
        capture_output=True, text=True, timeout=30
    )
    if "has been started" in result.stdout or "already" in result.stdout.lower():
        print("  Machine is running")
        time.sleep(3)  # Wait for boot
        return True
    print(f"  Machine start: {result.stdout.strip()} {result.stderr.strip()}")
    time.sleep(5)
    return True

def run_remote(py_cmd, retries=3):
    """Run a python command on the remote machine with retry logic."""
    cmd = ["fly", "ssh", "console", "-a", APP, "-C", f'python3 -c "{py_cmd}"']
    for attempt in range(retries):
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        combined = result.stdout + result.stderr
        if "no started VMs" in combined or "unhealthy" in combined:
            print(f"  Machine stopped, restarting... (attempt {attempt+1})")
            ensure_machine_running()
            continue
        return result
    return result

# Read and encode the database
with open(DB_PATH, "rb") as f:
    db_bytes = f.read()

b64_data = base64.b64encode(db_bytes).decode()
total_size = len(db_bytes)
total_chunks = (len(b64_data) + CHUNK_SIZE - 1) // CHUNK_SIZE

print(f"Database: {total_size} bytes, {len(b64_data)} b64 chars, {total_chunks} chunks")

# Ensure machine is running first
print("Ensuring machine is running...")
ensure_machine_running()

# Upload chunks
for i in range(total_chunks):
    chunk = b64_data[i * CHUNK_SIZE : (i + 1) * CHUNK_SIZE]
    mode = "wb" if i == 0 else "ab"
    
    py_cmd = f"import base64; data=base64.b64decode('{chunk}'); f=open('{REMOTE_PATH}','{mode}'); f.write(data); f.close(); print(f'Chunk {i+1}/{total_chunks}: {{len(data)}} bytes')"
    
    print(f"Uploading chunk {i+1}/{total_chunks}...")
    result = run_remote(py_cmd)
    
    combined = result.stdout + result.stderr
    if f"Chunk {i+1}" in combined:
        # Extract just the chunk line
        for line in combined.split('\n'):
            if 'Chunk' in line:
                print(f"  OK: {line.strip()}")
                break
    else:
        print(f"  ERROR: {combined.strip()}")
        sys.exit(1)

# Verify
print("\nVerifying remote file...")
result = run_remote(f"import os; s=os.path.getsize('{REMOTE_PATH}'); print(f'Remote size: {{s}} bytes')")
for line in result.stdout.split('\n'):
    if 'Remote' in line:
        print(line.strip())
        break
print(f"Expected size: {total_size} bytes")

# Also verify request count
result = run_remote("import sqlite3; c=sqlite3.connect('/data/pickngo_v2.db'); r=c.execute('SELECT COUNT(*) FROM requests').fetchone(); print(f'Remote requests: {r[0]}')")
for line in result.stdout.split('\n'):
    if 'Remote requests' in line:
        print(line.strip())
        break

print("\nDone! Restart the app with: fly apps restart pick-n-go")
