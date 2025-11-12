import stealth_requests
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.infrastructure.utils import convert_to_markdown
from .utils import strip_doc

def retrieve_url(url: Optional[str] = None, *args, **kwargs) -> str:
    if not url:
        print("The model attempted to do a silly thing: fetch a URL without providing one.")
        print(url, args, kwargs)
        return "error: missing 'url' for fetch_url"

    response = stealth_requests.get(url)
    document = response.text
    document = strip_doc(document)
    if response.status_code == 200:
        return convert_to_markdown(document)
    return f"Failed to retrieve URL: {response.status_code} {response.reason}"

class RetrieveUrlInput(BaseModel):
    url: Optional[str] = Field(None, description="The URL to retrieve")
    model_config = ConfigDict(extra="allow")
