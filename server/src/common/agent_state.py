from common.markdown import analysis_data
from langgraph.graph import MessagesState
from dataclasses import dataclass
from typing import Optional, TypedDict

@dataclass
class StateAction(TypedDict):
    type: str
    parameters: dict

@dataclass
class StateContext(TypedDict):
    analysis_data: dict[str, any]
    metrics: list[dict[str, any]]


@dataclass
class StateTicker(TypedDict):
    ticker: str
    exchange: str
    industry_link: str
    industry_name: str
    quote_type: str
    rank: float
    regular_market_change: float
    regular_market_percent_change: float
    regular_market_price: float
    short_name: str
    time: str

@dataclass
class AgentState(MessagesState):
    locale: str = "en-US"
    action: Optional[StateAction] = None
    ticker: Optional[StateTicker] = None
    suggestions: Optional[list[str]] = None
    context: Optional[StateContext] = None
    ui: Optional[list] = None


