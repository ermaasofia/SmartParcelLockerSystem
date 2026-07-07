import base64
data = open('pickngo_v2_upload.db', 'rb').read()
b64 = base64.b64encode(data).decode()
# Write a small Python script to be executed remotely
script = f"""
import base64
data = base64.b64decode('{b64}')
with open('/data/pickngo_v2.db', 'wb') as f:
    f.write(data)
print(f'Written {{len(data)}} bytes to /data/pickngo_v2.db')
"""
with open('upload_script.py', 'w') as f:
    f.write(script)
print(f"Script created ({len(b64)} b64 chars)")
