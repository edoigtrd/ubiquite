from __future__ import annotations
from abc import ABC, abstractmethod
from typing import List
from pydantic import BaseModel
from typing import ClassVar, Dict, Type
from backend.infrastructure.config import load_config


class ImageResult(BaseModel):
    title: str
    url: str
    source: str
    img : str

class ImageReranker(ABC):
    @abstractmethod
    def rerank(self, images: List[ImageResult], user_query: str) -> List[ImageResult]:
        pass

    def __init__(self, **kwargs) -> None:
        super().__init__()

class ImageRerankerRegistry:
    default_registry: ClassVar[ImageRerankerRegistry] | None = None

    def __init__(self) -> None:
        self.registry: Dict[str, Type[ImageReranker]] = {}

    def register(self, reranker_cls: Type[ImageReranker]) -> None:
        if not issubclass(reranker_cls, ImageReranker):
            raise ValueError("Only ImageReranker subclasses can be registered")
        self.registry[reranker_cls.__name__] = reranker_cls

    @classmethod
    def get_default_registry(cls) -> "ImageRerankerRegistry":
        if cls.default_registry is None:
            cls.default_registry = ImageRerankerRegistry()
        return cls.default_registry
    
    @classmethod
    def get_default_reranker(cls) -> ImageReranker:
        cfg = load_config()
        reranker_name = cfg.get("images_search.reranker.class", "SizeReranker")
        reranker_config = cfg.get("images_search.reranker.config", {})
        reranker_cls = cls.get_default_registry().registry.get(reranker_name)
        if reranker_cls is None:
            raise ValueError(f"Reranker '{reranker_name}' not found in registry")
        return reranker_cls(**reranker_config)

# Dynamically import all modules in this package to register rerankers
import importlib
import pkgutil

for module_info in pkgutil.iter_modules(__path__):
    module_name = module_info.name
    importlib.import_module(f"{__name__}.{module_name}")