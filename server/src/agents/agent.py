"""
This is the main entry point for the agent.
It defines the workflow graph, state, tools, nodes and edges.
"""

from pkgutil import resolve_name
from common import markdown
from langchain_core.runnables import RunnableConfig
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from common.agent_state import AgentState, StateContext
from langgraph.types import StreamWriter
import asyncio
import uuid
from common.util import get_dict_json, get_at_items, get_latest_message_content
from agents.warren_buffett.agent import agent as warren_buffett_agent
from agents.aswath_damodaran.agent import agent as aswath_damodaran_agent
from agents.ben_graham.agent import agent as ben_graham_agent
from agents.bill_ackman.agent import agent as bill_ackman_agent
from llm.llm_model import ainvoke
from nodes.ticker_search import TickerSearch
from nodes.next_step_suggestions import NextStepSuggestions



ticker_search = TickerSearch[Command[Literal['clear_cache']]]({})
next_step_suggestions = NextStepSuggestions({})

analysis_agents = {
    'warren_buffett': warren_buffett_agent,
    'aswath_damodaran': aswath_damodaran_agent,
    'ben_graham': ben_graham_agent,
    'bill_ackman': bill_ackman_agent
}

def planner_node(state: AgentState, config: RunnableConfig):
    """
    Initialize the planner node by setting up the context in the agent state.
    
    Args:
        state (AgentState): The current state of the agent containing context and messages
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        dict: Updated context dictionary
    """
    context = state.get('context')
    if context is None:
        context = {}
    return {'context':context}

async def intent_recognition(state: AgentState, config: RunnableConfig):
    """
    Recognize the user's intent from their message and classify it into one of five types:
    1. Search/query stock information
    2. Analyze/ask about holding/buying/selling
    3. Query with date range
    4. Query with specific metrics
    5. Other/unrecognized queries
    
    Args:
        state (AgentState): The current state of the agent containing context and messages
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        dict: Action dictionary containing the recognized intent type and parameters
    """
    prompt = """You are a precise intent recognition system for stock-related queries. Strictly classify inputs into one of five intents based **only** on explicit linguistic triggers. Output **ONLY** the required JSON—no explanations, prefixes, or deviations. Critical updates for Intent 1/2 accuracy:  

### 🔑 Key Requirements  
- **Intent 1 (Search/query stock info)**: **ONLY** triggered by **purely informational requests** (e.g., "show", "search", "info", "details", "price of", "what is") **without transactional context**. Stock reference is primary.  
- **Intent 2 (Analyze a stock or ask for holding/buying/selling)**: **ONLY** triggered by **explicit transactional language** (e.g., "analyze [stock]", "should I buy/sell/hold", "is it good to", "recommendation for", "advice on purchasing", "analyze [stock] for entry/exit"). Must contain **action-oriented verbs or decision-seeking phrases**.  
- **Intent 3**: Requires **explicit date range** (e.g., "from [date] to [date]", "in 2023") + ≥1 stock.  
- **Intent 4**: Requires **explicit metric specification** (e.g., "EPS", "P/E ratio", "Q3 revenue") + ≥1 stock.  
- **Intent 5**: No stock reference **OR** no match to 1-4, give **two suggestions** to the user to match the 4 intents.  
- **All intents 1-4**:  
  - Include market suffix in `symbol` (e.g., `AAPL`, `700.HK`).  
  - Resolve stock names to English names/codes (e.g., "腾讯" → `Tencent`, `Tencent Holdings Ltd.`, `0700.HK`).  
  - Validate dates as ISO (`YYYY-MM-DD`).  
  - For Intent 4, `metrics_content` must **concisely summarize the metric** (e.g., `"Q3 2023 P/E ratio"`).  

### 📌 Output Rules (Strict Compliance)  
- **Intent 1 Example**: `{"type": 1, "parameters": {"tickers": [{"short_name": "Apple", "en_name": "Apple Inc.", "symbol": "AAPL"}]}}`  
  *(Trigger: "Show Apple stock details")*  
- **Intent 2 Example**: `{"type": 2, "parameters": {"tickers": [{"short_name": "Tesla", "en_name": "Tesla Inc.", "symbol": "TSLA"}]}}`  
  *(Trigger: "Should I buy Tesla now?")*  
- **Intent 3 Example**: `{"type": 3, "parameters": {"tickers": [{"short_name": "Google", "en_name": "Alphabet Inc.", "symbol": "GOOG"}], "start_date": "2023-01-01", "end_date": "2023-12-31"}}`  
- **Intent 4 Example**: `{"type": 4, "parameters": {"metrics_content": "Q3 2023 EPS", "tickers": [{"short_name": "Microsoft", "en_name": "Microsoft Corporation", "symbol": "MSFT"}]}}`  
- **Intent 5 Example**: `{"type": 5, "parameters": { "suggestions": ["Search Apple stock", "Should I buy Apple?"] }}`

### ⚠️ Critical Intent 1 vs 2 Differentiation  
| **Intent 1 (Info Only)**          | **Intent 2 (Transactional)**         |  
|-----------------------------------|--------------------------------------|  
| "Search Apple stock"              | "Should I buy Apple?"                |  
| "What is TSLA price?"             | "Is it time to sell Tesla?"          |  
| "Show Microsoft details"          | "Recommendation for holding MSFT"    |  

**Output ONLY the JSON—validate structure before responding.**
"""
    messages = [
            SystemMessage(content=prompt),
            state["messages"][-1]
        ]
    # not show in ui and not save in db
    output = await ainvoke(messages, config, stream=False)
    json_result = get_dict_json(output.content)
    type_mapping = {
        1: 'ticker_search',
        2: 'ticker_analysis',
        3: 'ticker_search',
        4: 'ticker_analysis'
    }
    json_result['type'] = type_mapping.get(json_result['type'], 'next_step_suggestions')
    if json_result['type'] == 'next_step_suggestions':
        return {"action": json_result, "messages": AIMessage(content="")}
    return {"action": json_result}

def intent_conditional(state: AgentState, config: RunnableConfig):
    """
    Determine the next node based on the recognized intent type.
    
    Args:
        state (AgentState): The current state of the agent containing the action
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        str: The name of the next node to execute based on the intent type
    """
    if state.get('action') is not None:
        return state.get('action')['type']
    return 'next_step_suggestions'

def ticker_analysis(state: AgentState, config: RunnableConfig):
    """
    Prepare tasks for ticker analysis by creating analysis tasks for each agent and ticker combination.
    This function manages a loop through multiple analysis tasks.
    
    Args:
        state (AgentState): The current state of the agent containing context, messages, and action
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        dict: Updated context with tasks and current task information
    """
    # is a loop, so we need to get the task_index
    context = state.get('context')
    if context.get('tasks') is None:
        # in last messages content, there some @agent_name content, get the @ list
        content = get_latest_message_content(state)
        agents = get_at_items(content)
        if agents is None or len(agents) == 0:
            # default use the first agent
            agents = [list(analysis_agents.keys())[0]]
        
        tickers = state.get('action').get('parameters').get('tickers')
        tasks = []
        for agent_name in agents:
            for ticker in tickers:
                tasks.append({
                    'agent': agent_name,
                    'ticker': ticker
                })
        context['tasks'] = tasks
        context['task_index'] = 0
    else:
        context['task_index'] += 1
    if context['task_index'] < len(context['tasks']):
        context['current_task'] = context['tasks'][context['task_index']]
    else:
         context['current_task'] = None
    return {'context': context}

def agent_conditional(state: AgentState, config: RunnableConfig):
    """
    Determine which analysis agent to route to based on the current task.
    
    Args:
        state (AgentState): The current state of the agent containing context with current task information
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        str: The name of the analysis agent to route to, or 'clear_cache' if all tasks are completed
    """
    context = state.get('context')
    if context.get('current_task') is not None and context.get('task_index') < len(context.get('tasks')):
        return context.get('current_task')['agent']
    return 'clear_cache'

def ticker_switch(state: AgentState, config: RunnableConfig) -> Command[Literal['clear_cache']]:
    """
    Handle ticker switching by generating a ticker selection message and clearing the action.
    
    Args:
        state (AgentState): The current state of the agent containing action parameters
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        Command: A command to goto 'clear_cache' with updated action and messages
    """
    message = AIMessage(content=markdown.ticker_select(state.get('action').get('parameters')))
    return Command(goto='clear_cache', update={'action': None, 'messages': [message]})


def planer_conditional(state: AgentState, config: RunnableConfig):
    """
    Determine the next node in the planning phase based on the action type.
    
    Args:
        state (AgentState): The current state of the agent containing the action
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        str: The name of the next node to execute based on the action type
    """
    if state.get('action') is not None:
        if state.get('action')['type'] == "ticker_switch":
        # The switch has been completed on the front-end, no back-end processing is required
            return "ticker_switch"
        elif state.get('action')['type'] == "ticker_analysis":
            return "ticker_analysis"
        return 'clear_cache'
    return 'intent_recognition'

def clear_cache(state: AgentState, config: RunnableConfig):
    """
    Clear the action and context from the agent state, effectively resetting the state.
    
    Args:
        state (AgentState): The current state of the agent
        config (RunnableConfig): Configuration for the runnable
        
    Returns:
        dict: A dictionary with cleared action and context
    """
    return {'action': None, 'context': {}}

# Define the workflow graph
# This creates a state graph that orchestrates the agent's behavior through various nodes
workflow = StateGraph(AgentState)
workflow.add_node("planner", planner_node)
workflow.add_node("ticker_switch", ticker_switch)
workflow.add_node("intent_recognition", intent_recognition)
workflow.add_node("ticker_search", ticker_search)
workflow.add_node("next_step_suggestions", next_step_suggestions)
workflow.add_node("ticker_analysis", ticker_analysis)

workflow.add_node("clear_cache", clear_cache)

# Define conditional edges that determine the flow based on the current state
workflow.add_conditional_edges("planner", planer_conditional, ["ticker_switch", "ticker_analysis", "intent_recognition", 'clear_cache'])
workflow.add_conditional_edges("intent_recognition", intent_conditional, ["ticker_search", "ticker_analysis", "next_step_suggestions", 'clear_cache'])

# Set entry point and define edges between nodes
workflow.set_entry_point("planner")
workflow.add_edge("ticker_search", 'clear_cache')
workflow.add_edge("next_step_suggestions", 'clear_cache')
workflow.add_edge("ticker_switch", 'clear_cache')
workflow.set_finish_point('clear_cache')

# ticker_analysis node, use conditional edge to switch to different analysis agent
# Add nodes for each analysis agent and connect them to the workflow

for name, node in analysis_agents.items():
    workflow.add_node(name, node)
    workflow.add_edge(name, 'ticker_analysis')
workflow.add_conditional_edges("ticker_analysis", agent_conditional, list(analysis_agents.keys()) + ['clear_cache'])

# Compile the workflow graph into a runnable agent
agent = workflow.compile()
