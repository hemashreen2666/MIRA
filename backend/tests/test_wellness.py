def test_wellness_insights_shape(client):
    response = client.get("/api/v1/wellness/insights?days=7")
    assert response.status_code == 200
    body = response.json()
    assert len(body["trend"]) == 7
    for point in body["trend"]:
        assert "day" in point and "consistency" in point and "brightness" in point
    assert isinstance(body["completion"], list)
