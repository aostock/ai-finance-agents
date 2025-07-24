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


def get_json(s: str) -> dict:
    if s == "" or s is None or s == "{}":
        return {}
    try:
        start = s.rfind("{")
        s = s[start:]
        end = s.find("}") + 1
        if end == 0:
            r = s + "}"
        else:
            r = s[0:end]
        # remove \ and \n from string
        r = r.replace('\\', '').replace('\n', '')
        return json.loads(r)
    except Exception as e:
        print('get_json error:', s, e)
        return {}


T = TypeVar('T')
class SearchTicker(Generic[T]):
    def __init__(self, options: Dict[str, Any]):
        self.options = options

    async def __call__(self, state: AgentState, writer: StreamWriter, config: RunnableConfig) -> T:
        if state.get('ticker') is not None:
            return {}
        # writer('start search ticker...')
        last_human_message = state['messages'][-1]
        messages = [
            SystemMessage(
                content="""
你是意图识别助手。请根据用户输入判断用户的输入中是否包含一直股票的名称，或股票的代码，如果包含，
请输出对应的股票名称或代码，如果有股票名称，请提供股票英文名称，否则输出空字符串。

请只输出对应的股票名称或代码的json, 输出示例：
{
    "name": "股票名称",
    "en_name": "股票英文名称",
    "code": "股票代码"
}
"""
            ),
            last_human_message
        ]

        # 此处不使用 await 方法，await 异步调用会让返回的信息显示在前端对话框中， 如果返回值中不设置 messages 为 response， 对话框中的消息在运行结束后消失
        response:BaseMessage = model.invoke(messages)
        
        text = response.content
        print("SearchTickerNode", text)
        json_result = get_json(text)
        query = json_result.get('code', '')
        if query == '':
            query = json_result.get('en_name', '')
        if query == '':
            query = json_result.get('name', '')
        lookup_result = []
        if query != '':
            lookup_result = lookup_ticker(query)
        json_markdown = f"""```TickerSelect
{json.dumps(lookup_result)}
```"""
        if len(lookup_result) == 0:
            return Command(
                update={
                    "messages": [AIMessage(content="can not find ticker, please check your input and try again")],
                }
            )
        return Command(
            update={
                "messages": [AIMessage(content=json_markdown)],
                "ticker": lookup_result[0]
            }
        )
        