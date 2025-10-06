from uuid import UUID
from sqlmodel import Field, SQLModel, create_engine
from uuid import uuid4
from datetime import datetime
from enum import Enum
from sqlmodel import Session, select
from typing import List, Union, Tuple
from backend.infrastructure.config import load_config
from backend.infrastructure.utils import Role
import re
from backend.application.url_tools import get_url_preview

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
    thoughts : str | None = Field(default=None)
    timestamp: str = Field(default_factory=now_iso)
    parent_id: str | None = Field(default=None, foreign_key="message.uuid")


class Source(SQLModel, table=True):
    id : int | None = Field(default=None, primary_key=True)
    uuid: str = Field(default_factory=lambda: str(uuid4()), index=True, unique=True)
    message_id: int = Field(foreign_key="message.id")
    message_uuid: str = Field(foreign_key="message.uuid")
    conversation_id : int | None = None
    title: str
    description: str | None = None
    image : str | None = None
    url: str
    site_name: str | None = None

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
    uuid: str | None = None,
    thoughts: str | None = None
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
        uuid=uuid,
        thoughts=thoughts,
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
    engine = get_engine()
    with Session(engine) as session:
        msgs = session.exec(
            select(Message).where(Message.conversation_id == chain_id)
        ).all()

    if not msgs:
        return []

    uuids = {m.uuid for m in msgs}
    orphans = [m for m in msgs if m.parent_id is not None and m.parent_id not in uuids]
    assert not orphans, f"Found message(s) with missing parent in conversation {chain_id}: {[m.uuid for m in orphans]}"

    roots = [m for m in msgs if m.parent_id is None]
    assert len(roots) == 1, f"Expected exactly 1 root, found {len(roots)} in conversation {chain_id}"
    root = roots[0]

    children_map = {}
    for m in msgs:
        if m.parent_id is not None:
            children_map.setdefault(m.parent_id, []).append(m)

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

        children.sort(key=lambda x: (x.timestamp, x.id or 0), reverse=True)
        cur = children[0]

    return chain


def get_conversation_chain_messages(chain_id: int) -> List[Message]:
    engine = get_engine()
    with Session(engine) as session:
        msgs = session.exec(
            select(Message).where(Message.conversation_id == chain_id)
        ).all()

    if not msgs:
        return []

    uuids = {m.uuid for m in msgs}
    orphans = [m for m in msgs if m.parent_id is not None and m.parent_id not in uuids]
    assert not orphans, f"Found message(s) with missing parent in conversation {chain_id}: {[m.uuid for m in orphans]}"

    roots = [m for m in msgs if m.parent_id is None]
    assert len(roots) == 1, f"Expected exactly 1 root, found {len(roots)} in conversation {chain_id}"
    root = roots[0]

    children_map = {}
    for m in msgs:
        if m.parent_id is not None:
            children_map.setdefault(m.parent_id, []).append(m)

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

def delete_conversation_by_uuid(conversation_uuid: UUID) -> None:
    with Session(get_engine()) as session:
        statement = select(Message).where(
            Message.conversation_id == select(Conversation.id).where(Conversation.uuid == conversation_uuid).scalar_subquery())
        results = session.exec(statement).all()
        for msg in results:
            session.delete(msg)
        session.commit()

    # remove sources


    with Session(get_engine()) as session:
        statement = select(Conversation).where(Conversation.uuid == conversation_uuid)
        result = session.exec(statement).first()
        if result:
            session.delete(result)
            session.commit()


def create_source_pipeline(
    message_uuid: Message
) :
    message = get_message_by_uuid(message_uuid)
    if message is None:
        raise ValueError("Message not found")
    urls = re.findall(r'(https?:\/[^\s)]+)', message.content)
    sources = []
    for url in urls:
        preview = get_url_preview(url)
        source = Source(
            message_id=message.id,
            message_uuid=message.uuid,
            conversation_id=message.conversation_id,
            title=preview.title or url,
            description=preview.description,
            image=preview.image,
            url=preview.url,
            site_name=preview.site_name
        )
        sources.append(source)
        with Session(get_engine()) as session:
            session.add(source)
            session.commit()
            session.refresh(source)
    return sources

def get_sources_by_message_uuid(message_uuid: str) -> List[Source]:
    with Session(get_engine()) as session:
        statement = select(Source).where(Source.message_uuid == message_uuid)
        results = session.exec(statement).all()
        return results