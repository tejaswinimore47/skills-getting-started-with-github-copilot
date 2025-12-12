import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))

from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # check a known activity from the fixture
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "temporary_student@example.com"

    # ensure the email is not present initially
    resp = client.get("/activities")
    assert resp.status_code == 200
    before = resp.json()
    assert email not in [p.lower() for p in before[activity]["participants"]]

    # sign up
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")

    # verify added
    resp = client.get("/activities")
    after = resp.json()
    assert email in [p.lower() for p in after[activity]["participants"]]

    # unregister
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Unregistered" in body.get("message", "")

    # verify removed
    resp = client.get("/activities")
    final = resp.json()
    assert email not in [p.lower() for p in final[activity]["participants"]]
