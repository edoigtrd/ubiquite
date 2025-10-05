from importlib import import_module
from typing import Tuple, Dict, Any, Type
from pydantic import BaseModel


PROVIDERS = {
    "openai": ("langchain_openai", "ChatOpenAI"),
    "mistral": ("langchain_mistralai", "ChatMistralAI"),
    "groq": ("langchain_groq", "ChatGroq"),
}


class ModelConfig(BaseModel):
    provider: str
    model_name: str
    config: Dict[str, Any] = {}
    provider_instance: str
    cls: Any
    model_preset: str | None = None

    def dump(self) -> Dict[str, Any]:
        return {
            "provider_type": self.provider,
            "model_name": self.model_name,
            "provider": self.provider_instance,
            "model_preset": self.model_preset,
        }


def get_model(cfg, model: str) -> ModelConfig:
    provider_name = cfg.get(f"models.{model}.provider")
    model_name = cfg.get(f"models.{model}.model_name", default=None)
    prov_cfg = cfg.get(f"provider.{provider_name}") or {}
    provider_type = prov_cfg.get("type")

    if not provider_type or provider_type not in PROVIDERS:
        raise ValueError(f"Unknown or missing provider type: {provider_type}")

    mod_name, cls_name = PROVIDERS[provider_type]
    ModelCls = getattr(import_module(mod_name), cls_name)

    provider_kwargs = {k: v for k, v in prov_cfg.items() if k != "type"}
    if model_name:
        provider_kwargs["model"] = model_name

    return ModelConfig(
        provider=provider_type,
        model_name=model_name,
        config=provider_kwargs,
        cls=ModelCls,
        provider_instance=provider_name,
        model_preset=model,
    )
