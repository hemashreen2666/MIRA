def test_recommendations_generated_after_analysis(client):
    client.post("/api/v1/skin-analysis/analyze")
    response = client.get("/api/v1/recommendations")
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) >= 1
    for item in items:
        assert item["priority"] in ["Low", "Medium", "High"]


def test_repeated_analysis_does_not_duplicate_recommendations(client):
    for _ in range(4):
        client.post("/api/v1/skin-analysis/analyze")
    items = client.get("/api/v1/recommendations").json()["items"]
    slugs = [i["id"] for i in items]
    assert len(slugs) == len(set(slugs))  # one row per slug, no pile-up


def test_add_recommendation_to_routine_by_slug(client):
    client.post("/api/v1/skin-analysis/analyze")
    slug = client.get("/api/v1/recommendations").json()["items"][0]["id"]

    response = client.patch(f"/api/v1/recommendations/{slug}/add-to-routine")
    assert response.status_code == 200
    assert response.json()["addedToRoutine"] is True

    # flag persists and survives a re-analysis (upsert must not reset it)
    client.post("/api/v1/skin-analysis/analyze")
    items = client.get("/api/v1/recommendations").json()["items"]
    assert next(i for i in items if i["id"] == slug)["addedToRoutine"] is True


def test_add_unknown_recommendation_returns_404(client):
    assert client.patch("/api/v1/recommendations/nope/add-to-routine").status_code == 404
