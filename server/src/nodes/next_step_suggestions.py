import uuid
from common.agent_state import AgentState
from langchain_core.runnables import RunnableConfig
from typing import Dict, Any
from llm.llm_model import model, ainvoke
from common.util import get_array_json



class NextStepSuggestionsNode():
    def __init__(self, options: Dict[str, Any]):
        self.options = options

    async def __call__(self, state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
        messages = state["messages"]
        prompt = f"""Based on current conversation, predict user intent and generate 2 intelligent question suggestions:
1. Questions should be specific and valuable
2. Avoid overly broad or repetitive queries
3. Consider users' actual scenario needs
4. Uniform format for easy selection

Please output in the following JSON format:
[ "Question 1","Question 2"]
"""
        messages.append({"role": "system", "content": prompt})

        # not show in ui and not save in db
        output = await ainvoke(messages, response_metadata={"hide": True, "key": "key_value"})
        json_result = get_array_json(output.content)
        return {"suggestions": json_result}
