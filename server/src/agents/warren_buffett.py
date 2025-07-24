"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from pkgutil import resolve_name
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
from nodes.search_ticker import SearchTicker


@tool
def get_weather(location: str):
    """
    Get the weather for a given location.
    """
    return f"The weather for {location} is 70 degrees."

# @tool
# def your_tool_here(your_arg: str):
#     """Your tool description here."""
#     print(f"Your tool logic here")
#     return "Your tool response here."

tools = [
    # get_weather
    # your_tool_here
]

async def chat_ticker(state: AgentState, config: RunnableConfig) -> Command[Literal[END]]:
    """
    Standard chat node based on the ReAct design pattern. It handles:
    - The model to use (and binds in CopilotKit actions and the tools defined above)
    - The system prompt
    - Getting a response from the model
    - Handling tool calls

    For more about the ReAct design pattern, see: 
    https://www.perplexity.ai/search/react-agents-NcXLQhreS0WDzpVaS4m9Cg
    """

    # 3. Define the system message by which the chat model will be run
    system_message = SystemMessage(
        content=f"You are a helpful assistant. Talk in {state.get('language', 'english')}."
    )

    # 4. Run the model to generate a response
    response = await model.ainvoke([
        system_message,
        *state["messages"],
    ], config)

    # 6. We've handled all tool calls, so we can end the graph.
    return Command(
        goto=END,
        update={
            "messages": response
        }
    )

search_ticker = SearchTicker[Command[Literal[END, 'chat_ticker']]]({})

def planer(state: AgentState, config: RunnableConfig) -> Command[Literal[END, 'search_ticker', 'chat_ticker']]:
    
    return {}


def planer_conditional(state: AgentState, config: RunnableConfig) -> Command[Literal['search_ticker', 'chat_ticker']]:
    if state.get('ticker') is None:
        return "search_ticker"
    return "chat_ticker"

# Define the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("planer", planer)
workflow.add_node("search_ticker", search_ticker)
workflow.add_node("chat_ticker", chat_ticker)
workflow.add_conditional_edges("planer", planer_conditional, ["search_ticker", "chat_ticker"])
workflow.set_entry_point("planer")

# Compile the workflow graph
warren_buffett = workflow.compile()
