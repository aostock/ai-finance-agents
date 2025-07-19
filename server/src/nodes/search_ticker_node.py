from code import interact
from src.common.agent_state import AgentState
from langchain_core.runnables import RunnableConfig
from typing import Dict, Any


class SearchTickerNode():
    def __init__(self, options: Dict[str, Any]):
        self.options = options

    def __call__(self, state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
        if hasattr(state, 'ticker') and state.ticker is not None:
            return
        result = interact({
            "task": "search ticker",
            "ticker": ""
        }, exitmsg="Exit")
        print("SearchTickerNode", result)
        return {
            "ticker": result
        }
        