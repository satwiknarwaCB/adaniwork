import requests
import sys

BASE_URL = "http://localhost:8001"

def test_endpoint(method, endpoint, params=None, json=None):
    url = f"{BASE_URL}{endpoint}"
    try:
        headers = {"Accept-Encoding": "identity"}
        if method == "GET":
            response = requests.get(url, params=params, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=json, headers=headers)
        
        print(f"{method} {endpoint}: {response.status_code}")
        if response.status_code == 200:
            print("Success")
            # print(response.json())
        else:
            print("Failed")
            print(response.text)
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

def main():
    print("Verifying FastAPI...")
    
    # Health Check
    test_endpoint("GET", "/health")
    
    # Table Data (might be empty if DB is fresh, but should return 200)
    test_endpoint("GET", "/table-data", params={"fiscalYear": "FY_25"})
    
    # Dropdown Options
    test_endpoint("GET", "/dropdown-options", params={"fiscalYear": "FY_25"})
    
    print("All checks passed!")

if __name__ == "__main__":
    main()
