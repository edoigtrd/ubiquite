from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Conversation:
    id: Optional[int]
    uuid: str
    title: Optional[str]
    created_at: datetime
    updated_at: datetime


@dataclass
class Message:
    id: Optional[int]
    uuid: str
    conversation_id: int
    role: str
    content: str
    timestamp: datetime
    parent_id: Optional[str]
