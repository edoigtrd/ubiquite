from uuid import UUID
from sqlmodel import Field, SQLModel, create_engine
from uuid import uuid4
from datetime import datetime
from enum import Enum
from sqlmodel import Session, select
from app.config import load_config
from typing import List, Union, Tuple
from app.utils import Role

ENGINE = None
def get_engine():
    global ENGINE
    if ENGINE is not None:
        return ENGINE
    url = load_config().get("database.url", "sqlite:///database.db")
    engine = create_engine(url, echo=False)
    SQLModel.metadata.create_all(engine)
    ENGINE = engine
    return engine



def now_iso() -> str:
    return datetime.utcnow().isoformat()

class Conversation(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    uuid: str = Field(default_factory=lambda: str(uuid4()), index=True, unique=True)
    title: str | None = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class ConversationDTO(SQLModel):
    model_config = {"from_attributes": True}
    id: int
    uuid: str
    title: str | None = None
    created_at: str
    updated_at: str

class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    uuid: str = Field(default_factory=lambda: str(uuid4()), index=True, unique=True)
    conversation_id: int = Field(foreign_key="conversation.id")
    role: Role
    content: str
    timestamp: str = Field(default_factory=now_iso)
    parent_id: str | None = Field(default=None, foreign_key="message.uuid")

def create_conversation() -> Conversation:
    conv = Conversation(title=None)
    return conv

def get_conversation_by_id(conversation_id: int) -> Conversation | None:
    with Session(get_engine()) as session:
        statement = select(Conversation).where(Conversation.id == conversation_id)
        result = session.exec(statement).first()
        return result

def get_conversation_by_uuid(conversation_uuid: str) -> Conversation | None:
    with Session(get_engine()) as session:
        statement = select(Conversation).where(Conversation.uuid == conversation_uuid)
        result = session.exec(statement).first()
        return result

def get_message_by_uuid(message_uuid: str) -> Message | None:
    with Session(get_engine()) as session:
        statement = select(Message).where(Message.uuid == message_uuid)
        result = session.exec(statement).first()
        return result

def create_message(
    role: Role,
    content: str,
    parent: str | None = None,
    uuid: str | None = None
) -> Tuple[Message, Conversation]:
    
    if parent is None or parent == 0:
        conversation = create_conversation()
        conversation_id = conversation.id
        parent_id = None
    else:
        parent_msg = get_message_by_uuid(parent)
        if parent_msg is None:
            raise ValueError("Parent message not found")
        conversation_id = parent_msg.conversation_id
        conversation = get_conversation_by_id(conversation_id)
        if conversation is None:
            raise ValueError("Conversation not found")
        conversation.updated_at = now_iso()
        parent_id = parent_msg.uuid
    
    if uuid is None:
        uuid = str(uuid4())

    if isinstance(uuid, UUID):
        uuid = str(uuid)
    
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        parent_id=parent_id,
        uuid=uuid
    )
    with Session(get_engine()) as session:
        if conversation.id is None:
            session.add(conversation)
            session.flush()
            session.refresh(conversation)
            msg.conversation_id = conversation.id
        session.add(msg)
        session.commit()
        session.refresh(msg)
        dto = ConversationDTO.model_validate(conversation, from_attributes=True)
    return msg, dto

def get_conversation_messages(conversation_id: int) -> List[Message]:
    with Session(get_engine()) as session:
        statement = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp)
        results = session.exec(statement).all()
        return results


def get_conversation_chain_data(
    chain_id: int, resolve_enum: bool = False
) -> List[Tuple[Union[Role, str], str]]:
    """
    Build the linear message chain for a conversation.

    Rules:
    - Exactly one root (parent_id is None) must exist in the conversation.
    - At each step, pick the most recent direct child by `timestamp` (tie-breaker: `id`).
    - Assert if a message is visited twice (cycle).
    - Assert if any message has a non-existent parent within the same conversation.
    - Return a list of (Role, content) tuples from root to leaf.
    - If `resolve_enum=True`, the Role Enum is replaced by its value (str).

    Args:
        chain_id (int): Conversation.id to load.
        resolve_enum (bool, optional): Whether to return Role enums or their string values.

    Returns:
        List[Tuple[Union[Role, str], str]]: Ordered chain (role, content) from root to latest leaf.
    """
    engine = get_engine()
    with Session(engine) as session:
        msgs = session.exec(
            select(Message).where(Message.conversation_id == chain_id)
        ).all()

    if not msgs:
        return []

    # Integrity: every non-null parent_id must exist among uuids of the same conversation
    uuids = {m.uuid for m in msgs}
    orphans = [m for m in msgs if m.parent_id is not None and m.parent_id not in uuids]
    assert not orphans, f"Found message(s) with missing parent in conversation {chain_id}: {[m.uuid for m in orphans]}"

    # Root detection: exactly one message with parent_id is None
    roots = [m for m in msgs if m.parent_id is None]
    assert len(roots) == 1, f"Expected exactly 1 root, found {len(roots)} in conversation {chain_id}"
    root = roots[0]

    # Index children by parent uuid
    children_map = {}
    for m in msgs:
        if m.parent_id is not None:
            children_map.setdefault(m.parent_id, []).append(m)

    # Walk the chain, always choosing the most recent child
    chain: List[Tuple[Union[Role, str], str]] = []
    seen = set()

    cur = root
    while True:
        assert cur.uuid not in seen, f"Cycle detected at message {cur.uuid}"
        seen.add(cur.uuid)
        role_value = cur.role.value if resolve_enum else cur.role
        chain.append((role_value, cur.content))

        children = children_map.get(cur.uuid, [])
        if not children:
            break

        # Pick most recent by timestamp, tie-break by id
        children.sort(key=lambda x: (x.timestamp, x.id or 0), reverse=True)
        cur = children[0]

    return chain

def get_conversation_chain_messages(
        chain_id: int
    ) -> List[Message]:
    """
    Get all messages in the chain for a given conversation ID.
    Similar to get_conversation_chain_data but returns full Message objects.
    """
    engine = get_engine()
    with Session(engine) as session:
        msgs = session.exec(
            select(Message).where(Message.conversation_id == chain_id)
        ).all()

    if not msgs:
        return []

    # Integrity: every non-null parent_id must exist among uuids of the same conversation
    uuids = {m.uuid for m in msgs}
    orphans = [m for m in msgs if m.parent_id is not None and m.parent_id not in uuids]
    assert not orphans, f"Found message(s) with missing parent in conversation {chain_id}: {[m.uuid for m in orphans]}"

    # Root detection: exactly one message with parent_id is None
    roots = [m for m in msgs if m.parent_id is None]
    assert len(roots) == 1, f"Expected exactly 1 root, found {len(roots)} in conversation {chain_id}"
    root = roots[0]

    # Index children by parent uuid
    children_map = {}
    for m in msgs:
        if m.parent_id is not None:
            children_map.setdefault(m.parent_id, []).append(m)

    # Walk the chain, always choosing the most recent child
    chain: List[Message] = []
    seen = set()

    cur = root
    while True:
        assert cur.uuid not in seen, f"Cycle detected at message {cur.uuid}"
        seen.add(cur.uuid)
        chain.append(cur)

        children = children_map.get(cur.uuid, [])
        if not children:
            break

        # Pick most recent by timestamp, tie-break by id
        children.sort(key=lambda x: (x.timestamp, x.id or 0), reverse=True)
        cur = children[0]

    return chain

def set_title(conversation_id: int, title: str) -> None:
    with Session(get_engine()) as session:
        conversation = session.get(Conversation, conversation_id)
        if conversation is None:
            raise ValueError("Conversation not found")
        conversation.title = title
        conversation.updated_at = datetime.now().isoformat()
        session.add(conversation)
        session.commit()

def list_conversations() -> List[ConversationDTO]:
    with Session(get_engine()) as session:
        statement = select(Conversation).order_by(Conversation.updated_at.desc())
        results = session.exec(statement).all()
        dtos = [ConversationDTO.model_validate(c, from_attributes=True) for c in results]
        return dtos