"""FarmNexus Python FastAPI Backend (Compatibility entrypoint).
Allows running directly with `python backend/main.py` or uvicorn.
"""

import sys
import os
import uvicorn

# Add project root to sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend_python.main import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5050))
    print(f"🌾 FarmNexus FastAPI Backend starting on port {port}...")
    print(f"📖 Swagger Docs: http://localhost:{port}/docs")
    uvicorn.run(app, host="0.0.0.0", port=port)
