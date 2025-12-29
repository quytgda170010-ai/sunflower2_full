import requests
import json

try:
    url = "http://localhost:5002/api/behavior-monitoring"
    params = {
        'page': 1,
        'page_size': 10,
        'status': 'all',
        'from_date': '2025-12-17',
        'to_date': '2025-12-18'
    }
    resp = requests.get(url, params=params, timeout=30)
    data = resp.json()
    
    print(f"Status: {resp.status_code}")
    print(f"Total: {data.get('total', 0)}")
    print(f"Data count: {len(data.get('data', []))}")
    
    if data.get('data'):
        print("\n=== First log sample ===")
        print(json.dumps(data['data'][0], indent=2, ensure_ascii=False)[:1000])
    else:
        print("\n=== No data in response ===")
        print(json.dumps(data, indent=2, ensure_ascii=False)[:500])
        
except Exception as e:
    print(f"Error: {e}")
