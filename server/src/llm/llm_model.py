import os
from langchain.chat_models import init_chat_model
from pydantic import model_validator

os.environ["OPENAI_API_KEY"] = "sk-11c06c1595ac41c6a7f2c3265fb56997"
os.environ["OPENAI_API_BASE"] = "https://dashscope.aliyuncs.com/compatible-mode/v1"

model = init_chat_model("openai:qwen-max-latest")