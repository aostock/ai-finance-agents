from src.common.agent_state import AgentState
from langchain_core.runnables import RunnableConfig
from typing import Dict, Any


class FundamentalAnalysisNode():
    def __init__(self, options: Dict[str, Any]):
        self.options = options

    def __call__(self, state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
        pass