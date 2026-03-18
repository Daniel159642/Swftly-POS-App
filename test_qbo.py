import os
from dotenv import load_dotenv

load_dotenv()
print(f"Client ID present: {bool(os.environ.get('QBO_CLIENT_ID'))}")
print(f"Client secret present: {bool(os.environ.get('QBO_CLIENT_SECRET'))}")
