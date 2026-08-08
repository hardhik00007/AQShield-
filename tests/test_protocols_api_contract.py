from backend.app.services.protocol_registry import list_protocols


def test_protocol_registry_exposes_expected_protocols() -> None:
    protocol_ids = {item["id"] for item in list_protocols()}
    assert {"aqshield", "bb84", "ping-pong", "deng-long"}.issubset(protocol_ids)
