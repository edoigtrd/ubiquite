from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

from backend.infrastructure.config import load_main_config
from backend.infrastructure.tools import build_tools
from backend.application.prompts import build_common_prompt
from backend.infrastructure.utils import convert_to_yaml, sanitize_messages



def build_search_executor(ctx) -> AgentExecutor:
    llm = ctx.llm
    tools = build_tools(ctx) if ctx.tool_choice != False else []

    if ctx.focus :
        focus_info = {
            "name" : load_main_config().get("focuses.{}.name".format(ctx.focus)),
            "description" : load_main_config().get("focuses.{}.llm_description".format(ctx.focus)),
        }
        focus_info = convert_to_yaml(focus_info)
    else :
        focus_info = "No active focus"

    # Build prompt
    template = ctx.cfg(f"prompts.{ctx.task}.template")

    if not ctx.additional_context:
        additional_context = "N/A"
    else:
        additional_context = convert_to_yaml(ctx.additional_context) if isinstance(ctx.additional_context, dict) else ctx.additional_context

    template = template.format(additional_context=additional_context, focus_info=focus_info)
    prompt = ChatPromptTemplate.from_messages([
        ("system", template),
        *sanitize_messages(ctx.history),
        ("placeholder", "{agent_scratchpad}"),
    ])

    if ctx.tool_choice == False:
        pass
    elif ctx.tool_choice:
        llm = llm.bind_tools(tools, tool_choice=ctx.tool_choice)
    else:
        llm = llm.bind_tools(tools)
    agent = create_tool_calling_agent(llm, tools, prompt)
    executor = AgentExecutor(agent=agent, tools=tools)
    return executor


def build_title_executor(ctx) -> AgentExecutor:
    llm = ctx.llm
    prompt = ChatPromptTemplate.from_messages([
        ("system", ctx.cfg(f"prompts.{ctx.task}.template")),
        ("user", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    agent = create_tool_calling_agent(llm, [], prompt)
    executor = AgentExecutor(agent=agent, tools=[])
    return executor
