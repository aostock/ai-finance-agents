import requests
import time
import os

REMOTE_DATASET_URL = os.getenv('REMOTE_DATASET_URL').rstrip("/")


def get_financial_metrics(ticker, end_date=None, period='yearly'):
    data = _request(f'ticker/financial_metrics', query={'ticker': ticker, 'freq': period})
    # filter end_date <= data['date']
    if end_date:
        data = [item for item in data if item['date'] <= end_date]
    return data

def get_prices(ticker: str, start_date: str, end_date: str) -> list[dict]:
    return _request(f'ticker/prices', query={'ticker': ticker, interval:'1d', 'start_date': start_date, 'end_date': end_date})

def get_insider_transactions(ticker: str, end_date: str = None) -> list[dict]:
    data = _request(f'ticker/insider_transactions', query={'ticker': ticker})
    # filter start_date <= end_date
    if end_date:
        data = [item for item in data if item['date'] <= end_date]
    return data

def get_news(ticker: str, end_date: str = None) -> list[dict]:
    data = _request(f'ticker/news', query={'ticker': ticker, 'count': 200})
    # filter end_date <= data['pub_date']
    if end_date:
        data = [item for item in data if item['pub_date'] <= end_date]
    return data

def get_info(ticker: str) -> dict:
    return _request(f'ticker/info', query={'ticker': ticker})


def _request(url: str, query: dict = None, max_retries: int = 3) -> requests.Response:
    # format url, trim leading '/'
    url = f'{REMOTE_DATASET_URL}/api/v1/{url.lstrip("/")}'
    # format query string in url, and encode special characters
    if query:
        url += f'?{requests.utils.urlencode(query)}'
    
    for attempt in range(max_retries + 1):  # +1 for initial attempt
        response = requests.get(url, headers=headers)
        if response.status_code != 200 and attempt < max_retries:
            delay = 10 + (5 * attempt)
            print(f"Request Failed. Attempt {attempt + 1}/{max_retries + 1}. Waiting {delay}s before retrying...")
            time.sleep(delay)
            continue
        result = response.json()
        if result['code'] != 0:
            raise Exception(f'Failed to get data from remote dataset. Url: {url}, Error: {result["code"]}, Msg: {result["msg"]}')
        return result['data']
