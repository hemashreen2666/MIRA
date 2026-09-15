def test_privacy_status(client):
    response = client.get("/api/v1/privacy/status")
    assert response.status_code == 200
    body = response.json()
    assert body["imageStorage"] is False
    assert body["biometricStorage"] is False
    assert body["cloudProcessing"] is False
    assert body["localProcessing"] is True
