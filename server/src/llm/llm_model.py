import keyword
import os
from tkinter import TRUE
from langchain_litellm import ChatLiteLLM
from langchain.schema import AIMessage
from langgraph.types import StreamWriter
from pydantic import model_validator
from langchain_litellm import ChatLiteLLMRouter
from litellm import Router
from langchain.callbacks.base import BaseCallbackManager
from langchain.callbacks.streamlit import StreamlitCallbackHandler, BaseCallbackHandler
from uuid import UUID, uuid4
from langchain_core.messages import BaseMessage
from typing import Optional, Any, Union
from langchain.callbacks.base import AsyncCallbackHandler
from langchain_core.outputs import ChatGenerationChunk, GenerationChunk, LLMResult
from langchain_core.language_models.chat_models import _LC_ID_PREFIX


model_list = [
    {
        "model_name": "qwen3-235b-a22b",
        "litellm_params": {
            "model": "openai/qwen3-235b-a22b",
            "api_key": "sk-bac503b5a123456aa106e9574c89b0a0",
            "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        },
    },
    {
        "model_name": "deepseek-chat",
        "litellm_params": {
            "model": "deepseek/deepseek-chat",
            "api_key": "sk-9f7b6968585b48c18b032797824d9c8e"
        },
    },
    {
        "model_name": "deepseek-reasoner",
        "litellm_params": {
            "model": "deepseek/deepseek-reasoner",
            "api_key": "sk-9f7b6968585b48c18b032797824d9c8e"
        },
    },
]

def get_llm():
    litellm_router = Router(model_list=model_list)
    llm = ChatLiteLLMRouter(router=litellm_router, model_name="deepseek-chat")
    return llm

async def ainvoke(messages, config = None,  stream=TRUE):
    # create a new UUID
    # if hidden_stream:
    #     run_id = uuid4()
    #     if config is None:
    #         config = {}
    #     config["run_id"] = run_id
    #     message_id = f'{_LC_ID_PREFIX}-{run_id}'
    #     writer({
    #         "type": "hidden_stream",
    #         "message_id": message_id
    #     })
    return await get_llm().ainvoke(messages, config, stream=False)

async def ainvoke2(messages, config = None, response_metadata = None):
    full_content = ""
    message_id = None
    final_response_metadata = {}
    if response_metadata is None:
        response_metadata = {}
    final_response_metadata.update(response_metadata)
    async for event in get_llm().astream_events(messages, config=config, version="v2"):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if chunk.content:
                full_content += chunk.content
                if message_id is None:
                    message_id = chunk.id
                    # 只在第一次 chunk 中更新 response_metadata， chunk的操作是追加， 第一次更新后， 后续前端都会有这个值
                    chunk.response_metadata.update(response_metadata)
                else:
                    final_response_metadata.update(chunk.response_metadata)


    return AIMessage(content=full_content, id=message_id, response_metadata=final_response_metadata)

