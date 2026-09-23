def test_analyze_without_image_uses_mock_inference(client):
    response = client.post("/api/v1/skin-analysis/analyze")
    assert response.status_code == 200
    body = response.json()
    assert "analysis_id" in body
    assert "recommendation" in body
    assert len(body["metrics"]) == 7
    ids = {m["id"] for m in body["metrics"]}
    assert ids == {"acne", "redness", "darkCircles", "unevenTone", "brightness", "fatigue", "oily"}


def test_demo_analysis_is_anonymous_current_only_and_not_saved(client):
    before = client.get("/api/v1/skin-analysis/history/me").json()["total"]
    client.headers.clear()
    response = client.post("/api/v1/skin-analysis/demo/analyze")
    assert response.status_code == 200
    body = response.json()
    assert body["demo_scan_id"] == body["analysis_id"]
    assert all(metric["trend"] == 0 for metric in body["metrics"])
    assert client.get("/api/v1/skin-analysis/history/me").status_code == 401
    # Re-authenticate and verify the demo scan never created a SQLite record.
    login = client.post("/api/v1/auth/login", json={"username": "testuser", "password": "test-password"})
    client.headers.update({"Authorization": f"Bearer {login.json()['token']}"})
    assert client.get("/api/v1/skin-analysis/history/me").json()["total"] == before


def test_latest_skin_analysis_does_not_create_an_unsaved_record(client):
    response = client.get("/api/v1/skin-analysis/latest")
    assert response.status_code == 404
    assert client.get("/api/v1/skin-analysis/history/me").json()["total"] == 0


def test_skin_analysis_history_pagination(client):
    for _ in range(3):
        client.post("/api/v1/skin-analysis/analyze")
    response = client.get("/api/v1/skin-analysis/history/me?page=1&page_size=2")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 3
    assert len(body["items"]) == 2
    assert "recommendation" in body["items"][0]


def test_history_is_limited_to_authenticated_user(client):
    client.post("/api/v1/skin-analysis/analyze")
    first_user_token = client.headers["Authorization"]
    second = client.post("/api/v1/auth/register", json={
        "name": "Second User", "username": "seconduser", "email": "second@example.test", "password": "second-password",
    }).json()
    client.headers.update({"Authorization": f"Bearer {second['token']}"})

    response = client.get("/api/v1/skin-analysis/history/me")
    assert response.status_code == 200
    assert response.json()["total"] == 0

    client.headers.update({"Authorization": first_user_token})
    assert client.get("/api/v1/skin-analysis/history/me").json()["total"] == 1


def test_each_saved_analysis_has_its_own_timestamp(client):
    first = client.post("/api/v1/skin-analysis/analyze").json()
    second = client.post("/api/v1/skin-analysis/analyze").json()
    assert first["analyzed_at"] != second["analyzed_at"]

    history = client.get("/api/v1/skin-analysis/history/me").json()["items"]
    assert history[0]["analyzed_at"] == second["analyzed_at"]
