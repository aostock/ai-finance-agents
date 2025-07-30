import json
from code import interact
from typing import Any, Dict, Generic, TypeVar
from langchain.schema import AIMessage
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import END, StateGraph
from langgraph.types import Command, Literal, StreamWriter
from langchain_core.callbacks.manager import adispatch_custom_event

from common.agent_state import AgentState
from common.dataset import lookup_ticker
from llm.llm_model import model
from common.util import get_dict_json
import common.markdown as markdown


T = TypeVar('T')
class TickerSearch(Generic[T]):
    """
    This class is used to handle stock ticker search logic. It utilizes an intent recognition assistant 
    to determine if the user input contains a stock name or code. Based on the result, it looks up 
    the corresponding stock information and finally returns the search results or a prompt indicating 
    that no ticker was found.
    """
    
    def __init__(self, options: Dict[str, Any]):
        self.options = options

    async def __call__(self, state: AgentState, writer: StreamWriter, config: RunnableConfig) -> T:
        last_human_message = state['messages'][-1]
        messages = [
            SystemMessage(
                content="""
You are an intent recognition assistant. Please determine whether the user input contains the name of a stock or a stock code. If it does,
please output the corresponding stock name or code. If there is a stock name, please provide the English name of the stock; otherwise, output an empty string.

Please only output the JSON of the corresponding stock name or code. Example output:
{
    "name": "Stock Name",
    "en_name": "Stock English Name",
    "code": "Stock Code"
}
"""
            ),
            last_human_message
        ]

        # 此处不使用 await 方法，await 异步调用会让返回的信息显示在前端对话框中， 如果返回值中不设置 messages 为 response， 对话框中的消息在运行结束后消失
        response:BaseMessage = model.invoke(messages)
        
        text = response.content
        json_result = get_dict_json(text)
        query = json_result.get('code', '')
        if query == '':
            query = json_result.get('en_name', '')
        if query == '':
            query = json_result.get('name', '')
        lookup_result = []
        if query != '':
            lookup_result = lookup_ticker(query)
        
        if len(lookup_result) == 0:
            return {
                    "messages": [AIMessage(content="can not find ticker, please check your input and try again")],
                    "action": None
                }
        json_markdown = markdown.ticker_select({'list': lookup_result, 'selected': lookup_result[0]})
        return {
                "messages": [AIMessage(content=json_markdown)],
                "action": None
            }
        