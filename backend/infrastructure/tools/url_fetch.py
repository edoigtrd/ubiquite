import stealth_requests
from pydantic import BaseModel, Field
from backend.infrastructure.utils import convert_to_markdown
from .utils import strip_doc

def retrieve_url(url: str, *args, **kwargs) -> str:
    response = stealth_requests.get(url)
    document = response.text
    document = strip_doc(document)
    if response.status_code == 200:
        return convert_to_markdown(document)
    return f"Failed to retrieve URL: {response.status_code} {response.reason}"

class RetrieveUrlInput(BaseModel):
    url: str = Field(..., description="The URL to retrieve")