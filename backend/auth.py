import os
from typing import Optional

from fastapi import Header, HTTPException


def require_api_key(x_api_key: Optional[str] = Header(default=None)):
    expected_key = os.environ.get("RESPONSE_API_KEY", "dev-only-key-change-me")
    if x_api_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")