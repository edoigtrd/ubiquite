from dataclasses import dataclass, field
from typing import Any, List, Optional

from backend.infrastructure.providers import get_model, ModelConfig


@dataclass
class Context:
    cfg: Any
    task: str
    additional_context: str
    callbacks: List[Any] = field(default_factory=list)
    tool_choice: Optional[str] = "search_searx"
    base_llm: Any = None
    llm: Any = None
    model: Optional[ModelConfig] = None
    history: List[Any] = field(default_factory=list)
    focus: Optional[str] = None
    current_message_id : Optional[str] = None

    def _rebind_llm(self):
        if self.base_llm is None:
            return
        if self.callbacks:
            self.llm = self.base_llm.bind(callbacks=self.callbacks)
        else:
            self.llm = self.base_llm

    def add_callback(self, callback: Any):
        if callback not in self.callbacks:
            self.callbacks.append(callback)
            self._rebind_llm()

    def add_callbacks(self, new_callbacks: List[Any]):
        changed = False
        for cb in new_callbacks:
            if cb not in self.callbacks:
                self.callbacks.append(cb)
                changed = True
        if changed:
            self._rebind_llm()

    def set_callbacks(self, callbacks: List[Any]):
        self.callbacks = list(callbacks)
        self._rebind_llm()

    def clear_callbacks(self):
        self.callbacks.clear()
        self._rebind_llm()

    def set_history(self, history: List[Any]):
        self.history = history


def initialize_context(cfg, task: str, model: str, additional_context: str, callbacks: Optional[List[Any]] = None,
                       tool_choice: Optional[str] = "search_searx", history: Optional[List[Any]] = None, focus: Optional[str] = None, current_message_id: Optional[int] = None) -> Context:
    callbacks = callbacks or []
    ctx = Context(cfg=cfg, task=task, additional_context=additional_context, callbacks=list(callbacks),
                  tool_choice=tool_choice, model=model, history=history, focus=focus, current_message_id=current_message_id)

    model_ = get_model(cfg, model)
    base_llm = model_.cls(streaming=True, **model_.config)
    ctx.base_llm = base_llm
    ctx.model = model_
    ctx._rebind_llm()
    return ctx
