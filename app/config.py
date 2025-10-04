import io
try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:  # pragma: no cover
    import tomli as tomllib  # type: ignore
from glom import glom
from io import BytesIO


class GlomWrapper:
    def __init__(self, data: dict):
        self.data = data

    def get(self, path: str, default=None, **kwargs):
        try:
            return glom(self.data, path, **kwargs)
        except Exception:
            return default

    def __call__(self, path: str, default=None, **kwargs):
        return self.get(path, default=default, **kwargs)


def load_config(path: str = "config.toml") -> GlomWrapper:
    with io.open(path, "r", encoding="utf-8") as f:
        cfg_str = f.read()
    cfg = tomllib.loads(cfg_str)
    return GlomWrapper(cfg)


def config_check(string:str) :
    try:
        data = tomllib.load(BytesIO(string.encode("utf-8")))
        return True, data
    except Exception as e:
        return False, str(e)

def load_main_config() -> GlomWrapper:
    return load_config("config.toml")