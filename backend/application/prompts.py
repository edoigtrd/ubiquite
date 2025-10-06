from langchain_core.prompts import ChatPromptTemplate
from backend.infrastructure.utils import convert_to_yaml


def build_common_prompt(ctx) -> ChatPromptTemplate:
    template = ctx.cfg(f"prompts.{ctx.task}.template")

    if not ctx.additional_context:
        additional_context = "N/A"
    else:
        additional_context = convert_to_yaml(ctx.additional_context) if isinstance(ctx.additional_context, dict) else ctx.additional_context

    template = template.format(additional_context=additional_context)
    prompt = ChatPromptTemplate.from_messages([
        ("system", template),
        *ctx.history,
        ("placeholder", "{agent_scratchpad}"),
    ])
    return prompt
