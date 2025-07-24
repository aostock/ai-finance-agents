from langgraph.graph import MessagesState
from dataclasses import dataclass
from typing import Optional

@dataclass
class AgentState(MessagesState):
    locale: str = "en-US"
    action: Optional[str] = ""
    ticker: Optional[str] = ""
    end_date: Optional[str] = ""