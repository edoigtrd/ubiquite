from typing import Any, List
from uuid import UUID
from fastapi import FastAPI, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.config import load_config, config_check
from app.context import initialize_context
from app.agent import build_search_executor, build_title_executor
from app.meteo import get_weather_snapshot, reverse_geocode_city
import asyncio
from app.callbacks import StreamingCallbackHandler, BasicCallbackHandler, MessageOutput
from app.utils import get_timezone
import db
import json
from fastapi import Body, HTTPException
from pathlib import Path
import datetime
import uuid as uudid
from typing import Annotated

app = FastAPI()


ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

CONFIG_PATH = (Path(__file__).resolve().parent / "config.toml")

@app.get("/")
async def root():
    return "Hello World!"

@app.get("/settings/get")
async def get_settings():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    return Response(content, media_type="text/plain")

@app.post("/settings/set")
async def set_settings(settings: str = Body(..., embed=True, alias="settings")):
    is_valid, error = config_check(settings)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error)

    CONFIG_PATH.write_text(settings, encoding="utf-8")
    print(settings)
    load_config(str(CONFIG_PATH))
    return {"message": "Settings updated successfully"}

@app.get("/chat")
async def chat(q: str, preset="fast", parent:str = None, additional_context: str = None):

    db_message, db_conversation = db.create_message(
        role=db.Role.USER,
        content=q,
        parent=parent
    )

    history = db.get_conversation_chain_data(db_conversation.id, resolve_enum=True)

    handler = StreamingCallbackHandler()

    new_message_uuid = uudid.uuid4()


    def inner_callback(message: list[MessageOutput]):
        message = message[-1].content
        db.create_message(
            role=db.Role.ASSISTANT,
            content=message,
            parent=db_message.uuid,
            uuid = new_message_uuid,
        )

    def make_title_callback(messages: List[MessageOutput]):
        title_ctx = initialize_context(
            cfg=load_config("config.toml"),
            task="title",
            model="title",
            additional_context={},
            callbacks=[],
            tool_choice=[],
            history=[]
        )
        title_executor = build_title_executor(title_ctx)
        title_candidate = title_executor.invoke(
                {"input":"USER : {}\n\n\nASSISTANT : {}".format(q, messages[-1].content)}
        )
        title_candidate = title_candidate["output"].strip().strip('"').strip("'")
        db.set_title(db_conversation.id, title_candidate)
        

    callback_handler = BasicCallbackHandler(inner_callback)

    try :
        additional_context = json.loads(additional_context)
    except Exception:
        pass

    ctx = initialize_context(
        cfg=load_config("config.toml"),
        task="search",
        model=preset,
        additional_context=additional_context,
        callbacks=[handler, callback_handler],
        tool_choice=[],
        history=history
    )


    handler.queue.put_nowait(json.dumps({"event": "prelude", "data": {
        "conversation_uuid": db_conversation.uuid,
        "conversation_id": db_conversation.id,
        "model": ctx.model.dump(),
        "query_uuid": db_message.uuid,
        "response_uuid": str(new_message_uuid)
    }}))

    executor = build_search_executor(ctx)

    if db_conversation.title is None :
        title_callback_handler = BasicCallbackHandler(make_title_callback)
        ctx.add_callback(title_callback_handler)

    async def run_task():
        try:
            loop = asyncio.get_running_loop()

            def _call():
                try:
                    return executor.invoke({"input": q}, config={"callbacks":ctx.callbacks}, stream=True)
                except TypeError:
                    return executor.invoke({"input": q}, stream=True)

            res = loop.run_in_executor(None, _call)
            await res
        finally:
            handler.done()

    asyncio.create_task(run_task())

    return StreamingResponse(
        handler.stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )

@app.get("/conversation/read")
async def read_conversation(
    conversation_id: int | None = Query(None),
    uuid: UUID | None = Query(None)
):
    if (conversation_id is None and uuid is None) or (conversation_id is not None and uuid is not None):
        raise HTTPException(status_code=400, detail="Provide either 'conversation_id' or 'uuid', not both.")

    if uuid is not None:
        conversation = db.get_conversation_by_uuid(str(uuid))
    else:
        conversation = db.get_conversation_by_id(conversation_id)

    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    cid = conversation.id if hasattr(conversation, "id") else conversation_id
    messages = db.get_conversation_chain_messages(cid)

    return {"conversation": conversation, "messages": messages}


@app.get("/conversation/list")
async def list_conversations():
    conversations = db.list_conversations()
    return {"conversations": conversations}

@app.get("/meteo")
async def meteo(lat: float, lon: float):
    snapshot = get_weather_snapshot(lat, lon)
    return snapshot

@app.get("/selfinfo")
async def selfinfo(lat : float = None, lon: float = None):
    """ return informations about the request maker (location (city, country), timezone and local time and weekday) """
    if lat is not None and lon is not None:
        location = reverse_geocode_city(lat, lon)
        timezone = get_timezone(lat, lon)
        local_time = datetime.datetime.now(timezone)

        return {
            "location": location,
            "timezone": str(timezone),
            "date": local_time.strftime("%Y-%m-%d"),
            "weekday": local_time.strftime("%A"),
            "time": local_time.strftime("%I:%M:%S %p"),
        }
        
    return {"error": "Location not provided"}, 400

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)