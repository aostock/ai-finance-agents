from langgraph.graph import MessagesState
from dataclasses import dataclass
from typing import Optional
from copilotkit import CopilotKitState

@dataclass
class AgentState(MessagesState):
    locale: str = "en-US"
    action: Optional[str] = ""
    ticker: Optional[str] = ""
    end_date: Optional[str] = ""