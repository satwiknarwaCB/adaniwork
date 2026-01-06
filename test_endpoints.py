
import requests
import json

def test_chat():
    print("--- Testing Chat Endpoints on Port 8002 ---")
    
    # 1. Test specific route to verify routing engine
    try:
        r = requests.get("http://127.0.0.1:8002/api/chat-test", timeout=2)
        print(f"GET /api/chat-test: {r.status_code}")
        print(f"Response: {r.text}")
    except Exception as e:
        print(f"/api/chat-test Failed: {e}")

    # 2. Test actual chat route
    url = "http://127.0.0.1:8002/api/chat"
    payload = {
        "message": "Hello", 
        "context": {"summary": {"project": "Adani Green Energy"}}
    }
    
    try:
        r = requests.post(url, json=payload, timeout=5)
        print(f"POST /api/chat: {r.status_code}")
        if r.status_code != 200:
             print(f"Response Body: {r.text}")
        else:
             print("SUCCESS: Chat Endpoint is working!")
    except Exception as e:
        print(f"Request Failed: {e}")

if __name__ == "__main__":
    test_chat()
