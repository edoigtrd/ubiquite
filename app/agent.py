from langchain.agents import create_tool_calling_agent, AgentExecutor

from .tools import build_tools
from .prompts import build_common_prompt


def build_search_executor(ctx) -> AgentExecutor:
    llm = ctx.llm
    tools = build_tools(ctx) if ctx.tool_choice != False else []
    prompt = build_common_prompt(ctx)

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
    prompt = build_common_prompt(ctx)

    agent = create_tool_calling_agent(llm, [], prompt)
    executor = AgentExecutor(agent=agent, tools=[])
    return executor