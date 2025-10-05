from langchain.callbacks.base import BaseCallbackHandler
import asyncio
import json
from uuid import UUID
from langchain_core.agents import AgentFinish
from pydantic import BaseModel
from typing import Callable, Any, Optional
import glom

class MessageOutput(BaseModel):
    content: str


class StreamingCallbackHandler(BaseCallbackHandler):
    def __init__(self):
        self.queue: asyncio.Queue[str] = asyncio.Queue()
        self._done = asyncio.Event()
        self.current = 0

    def on_llm_start(self, *args, **kwargs) -> None:
        run_parent = kwargs.get("parent_run_id")
        run_tags = kwargs.get("tags", [])
        self.queue.put_nowait(
            json.dumps(
                {
                    "event": "start",
                    "id": self.current,
                    "parent": str(run_parent) if run_parent else None,
                    "tags": run_tags,
                }
            )
        )
        self.current += 1

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        run_parent = kwargs.get("parent_run_id")
        run_tags = kwargs.get("tags", [])
        if isinstance(token, list) :
            token = token[0]
        e_type = 'new_token'
        if isinstance(token, dict) :
            if "type" in token and token["type"] == "text" :
                token = token["text"]
            else :
                e_type = 'new_thinking_token'
                token = glom.glom(token, "thinking.0.text", default="")
        self.queue.put_nowait(
            json.dumps(
                {
                    "event": e_type,
                    "id": self.current,
                    "data": token,
                    "parent": str(run_parent) if run_parent else None,
                    "tags": run_tags,
                }
            )
        )
        self.current += 1

    def on_llm_end(self, *args, **kwargs) -> None:
        run_parent = kwargs.get("parent_run_id")
        run_tags = kwargs.get("tags", [])
        self.queue.put_nowait(
            json.dumps(
                {
                    "event": "llm_end",
                    "id": self.current,
                    "parent": str(run_parent) if run_parent else None,
                    "tags": run_tags,
                }
            )
        )
        self.current += 1

    def on_llm_error(self, error: Exception, **kwargs) -> None:
        self.queue.put_nowait(json.dumps({"event": "error", "id": self.current, "data": str(error)}))
        self._done.set()
        self.current += 1

    def on_tool_start(self, tool_input: str, tool_name: str, **kwargs) -> None:
        self.queue.put_nowait(
            json.dumps({"event": "tool_start", "id": self.current, "data": {"tool_name": tool_name, "tool_input": tool_input}})
        )
        self.current += 1

    def on_tool_end(self, output: str, **kwargs) -> None:
        self.queue.put_nowait(json.dumps({"event": "tool_end", "id": self.current, "data": {"output": output}}))
        self.current += 1

    async def stream(self):
        yield json.dumps({"event": "ok"}) + "\n"
        while not (self._done.is_set() and self.queue.empty()):
            try:
                item = await asyncio.wait_for(self.queue.get(), timeout=0.25)
                yield f"{item}\n"
            except asyncio.TimeoutError:
                yield json.dumps({"event": "heartbeat"}) + "\n"
        yield json.dumps({"event": "done"}) + "\n"

    def done(self):
        self._done.set()


class BasicCallbackHandler(BaseCallbackHandler):
    def __init__(self, callback: Callable) -> None:
        super().__init__()
        self.callback = callback
        self.buffers: dict[UUID, list[str]] = {}

    def on_llm_start(self, *_args, **_kwargs) -> None:
        run_id: UUID = _kwargs.get("run_id")
        if run_id is not None:
            self.buffers.setdefault(run_id, [])

    def on_llm_new_token(
        self,
        token: str,
        *,
        run_id: UUID,
        _parent_run_id: Optional[UUID] = None,
        **_kwargs: Any,
    ) -> Any:
        # skipping thinking tokens and non-string tokens
        if isinstance(token, list) :
            token = token[0]
        if isinstance(token, dict) :
            if "type" in token and token["type"] == "text" :
                token = token["text"]
            else :
                return
        self.buffers.setdefault(run_id, []).append(token)

    def on_agent_finish(
        self,
        finish: AgentFinish,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any
    ) -> Any:
        messages = [MessageOutput(content="".join(buf)) for _, buf in self.buffers.items()]
        self.callback(messages)
