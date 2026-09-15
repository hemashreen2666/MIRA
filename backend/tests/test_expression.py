def test_latest_expression_creates_one_if_missing(client):
    response = client.get("/api/v1/expression/latest")
    assert response.status_code == 200
    body = response.json()
    assert body["current"] in ["Happy", "Neutral", "Sad", "Tired"]
    assert set(body["states"]) == {"Happy", "Neutral", "Sad", "Tired"}


def test_run_expression_estimate(client):
    response = client.post("/api/v1/expression/estimate")
    assert response.status_code == 200
    assert 0 <= response.json()["confidence"] <= 1
