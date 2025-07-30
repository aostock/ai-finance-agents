import os
from langchain.chat_models import init_chat_model
from langchain.schema import AIMessage
from pydantic import model_validator
import uuid

os.environ["OPENAI_API_KEY"] = "sk-11c06c1595ac41c6a7f2c3265fb56997"
os.environ["OPENAI_API_BASE"] = "https://dashscope.aliyuncs.com/compatible-mode/v1"

model = init_chat_model("openai:qwen-max-latest")

async def ainvoke(messages, config = None, response_metadata = None):
    full_content = ""
    message_id = None
    final_metadata = {}
    final_metadata.update(response_metadata)
    async for event in model.astream_events(messages, config=config, version="v2"):
        if event["event"] == "on_chat_model_stream":
            chunk = event["data"]["chunk"]
            if chunk.content:
                full_content += chunk.content
                if message_id is None:
                    message_id = chunk.id
                    # 只在第一次 chunk 中更新 response_metadata， chunk的操作是追加， 第一次更新后， 后续前端都会有这个值
                    chunk.response_metadata.update(response_metadata)
                else:
                    final_metadata.update(chunk.response_metadata)


    return AIMessage(content=full_content, id=message_id, response_metadata=final_metadata)

