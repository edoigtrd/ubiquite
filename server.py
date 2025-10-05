"""Compatibility entrypoint that exposes the new FastAPI app.

The API has been moved to backend/presentation/api.py to follow a
domain-first screaming architecture. Import the app from there so
existing run commands keep working.
"""

from backend.presentation.api import app  # noqa: F401

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)