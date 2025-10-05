"""
Backend package organized with a screaming architecture:
- domain: core business concepts (entities, value objects)
- application: use cases, context, prompts
- infrastructure: external systems (DB, LLM providers, HTTP clients, config)
- presentation: delivery adapters (FastAPI API)
"""
