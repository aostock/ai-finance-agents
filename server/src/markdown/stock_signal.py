from pydantic import BaseModel
from typing_extensions import Literal
import json

class StockSignal(BaseModel):
    signal: Literal["bullish", "bearish", "neutral"]
    confidence: float
    reasoning: str

    def to_markdown(self) -> str:
        return f"""json```
        {self.to_json()}
```
"""
    
    def to_json(self) -> str:
        return json.dumps(self.dict())
