"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from pkgutil import resolve_name
from common import markdown
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from common.agent_state import AgentState
from llm.llm_model import model
from nodes.ticker_search import TickerSearch
from langgraph.types import StreamWriter
import asyncio
import uuid


ticker_search = TickerSearch[Command[Literal[END]]]({})

def planner_node(state: AgentState, config: RunnableConfig):
    context = state.get('context')
    if context is None:
        context = {}
    return {'context':context}

def intent_recognition(state: AgentState, config: RunnableConfig):
    return {}

def ticker_switch(state: AgentState, config: RunnableConfig) -> Command[Literal[END]]:
    message = AIMessage(content=markdown.ticker_select(state.get('action').get('parameters')))
    return Command(goto=END, update={'action': None, 'messages': [message]})


def planer_conditional(state: AgentState, config: RunnableConfig):
    if state.get('action') is not None:
        if state.get('action')['type'] == "ticker_switch":
        # The switch has been completed on the front-end, no back-end processing is required
            return "ticker_switch"
        return END
    return 'ticker_search'

# Define the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("planner", planner_node)
workflow.add_node("ticker_switch", ticker_switch)
workflow.add_node("ticker_search", ticker_search)
workflow.add_node("intent_recognition", intent_recognition)
workflow.add_conditional_edges("planner", planer_conditional, ["ticker_search", "ticker_switch", "intent_recognition", END])
workflow.add_edge("ticker_search", END)
workflow.add_edge("intent_recognition", END)
workflow.add_edge("ticker_switch", END)
workflow.set_entry_point("planner")

# Compile the workflow graph
planner = workflow.compile()
