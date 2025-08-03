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
from langchain_core.runnables import RunnableConfig
from common.settings import Settings

def get_llm(settings: Settings):
    litellm_router = Router(model_list=settings.get_model_list())
    llm = ChatLiteLLMRouter(router=litellm_router, model_name=settings.get_intent_recognition_model().get("model", ""))
    return llm

def get_analyzer(settings: Settings):
    litellm_router = Router(model_list=settings.get_model_list())
    llm = ChatLiteLLMRouter(router=litellm_router, model_name=settings.get_analysis_model().get("model", ""))
    return llm


async def ainvoke(messages, config: RunnableConfig,  stream=TRUE, analyzer=False):
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
    settings = Settings(config)
    if analyzer:
        return await get_analyzer(settings).ainvoke(messages, config, stream=stream)
    return await get_llm(settings).ainvoke(messages, config, stream=stream)




async def ainvoke2(messages, config: RunnableConfig, response_metadata = None):
    full_content = ""
    message_id = None
    final_response_metadata = {}
    if response_metadata is None:
        response_metadata = {}
    final_response_metadata.update(response_metadata)
    settings = Settings(config)
    async for event in get_llm(settings).astream_events(messages, config=config, version="v2"):
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

