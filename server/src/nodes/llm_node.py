from src.common.agent_state import AgentState
from langchain_core.runnables import RunnableConfig
from typing import Dict, Any
from src.llm.llm_model import model


class LLMNode():
    def __init__(self, options: Dict[str, Any]):
        self.options = options

    def __call__(self, state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
        output = model.invoke(self.options["messages"])
        return {"messages": [output]}