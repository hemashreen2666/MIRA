def test_analyze_without_image_uses_mock_inference(client):
    response = client.post("/api/v1/skin-analysis/analyze")
    assert response.status_code == 200
    body = response.json()
    assert "analysis_id" in body
    assert len(body["metrics"]) == 6
    ids = {m["id"] for m in body["metrics"]}
    assert ids == {"acne", "redness", "darkCircles", "unevenTone", "brightness", "oily"}


def test_latest_skin_analysis_creates_one_if_missing(client):
    response = client.get("/api/v1/skin-analysis/latest")
    assert response.status_code == 200
    assert len(response.json()["metrics"]) == 6


def test_skin_analysis_history_pagination(client):
    for _ in range(3):
        client.post("/api/v1/skin-analysis/analyze")
    response = client.get("/api/v1/skin-analysis/history?page=1&page_size=2")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 3
    assert len(body["items"]) == 2
