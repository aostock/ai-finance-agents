import json
from types import SimpleNamespace

def dict_to_obj(dictionary):
    if isinstance(dictionary, dict):
        return SimpleNamespace(**{k: dict_to_obj(v) for k, v in dictionary.items()})
    elif isinstance(dictionary, list):
        return [dict_to_obj(item) for item in dictionary]
    else:
        return dictionary

def get_dict_json(s: str) -> dict:
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


def get_array_json(s: str) -> list:
    if s == "" or s is None or s == "[]":
        return []
    try:
        start = s.rfind("[")
        s = s[start:]
        end = s.find("]") + 1
        if end == 0:
            r = s + "]"
        else:
            r = s[0:end]
        # remove \ and \n from string
        r = r.replace('\\', '').replace('\n', '')
        return json.loads(r)
    except Exception as e:
        print('get_json error:', s, e)
        return []

