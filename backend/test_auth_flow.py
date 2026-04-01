import requests
import json

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    # 1. Register
    print("Testing /register...")
    reg_data = {"email": "test@example.com", "password": "password123"}
    resp = requests.post(f"{BASE_URL}/register", json=reg_data)
    print(f"Register status: {resp.status_code}, {resp.json()}")

    # 2. Login
    print("\nTesting /login...")
    login_data = {"username": "test@example.com", "password": "password123"}
    resp = requests.post(f"{BASE_URL}/login", data=login_data)
    token = resp.json().get("access_token")
    print(f"Login status: {resp.status_code}, Token: {token[:20]}...")

    # 3. Save Roadmap (Protected)
    if token:
        print("\nTesting /save-roadmap (Protected)...")
        headers = {"Authorization": f"Bearer {token}"}
        roadmap_data = {
            "score": 8,
            "strengths": ["Python", "React"],
            "missing_skills": ["SQL", "Docker"],
            "roadmap_plan": [{"week": "Week 1", "focus": "SQL", "action_items": ["Learn SELECT", "Joins", "Aggregations"]}]
        }
        resp = requests.post(f"{BASE_URL}/save-roadmap", json=roadmap_data, headers=headers)
        print(f"Save status: {resp.status_code}")

    # 4. Get My History
    if token:
        print("\nTesting /my-history...")
        resp = requests.get(f"{BASE_URL}/my-history", headers=headers)
        print(f"History count: {len(resp.json())}")
        if len(resp.json()) > 0:
            print("Successfully retrieved user-specific history.")

if __name__ == "__main__":
    test_auth_flow()
