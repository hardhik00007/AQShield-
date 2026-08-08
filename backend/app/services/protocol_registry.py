from protocols.registry import PROTOCOLS


def list_protocols() -> list[dict[str, str]]:
    categories = {
        "aqshield": "adaptive-qsdc",
        "bb84": "qkd-inspired",
        "ping-pong": "qsdc",
        "deng-long": "qsdc",
    }
    return [
        {
            "id": protocol_id,
            "name": protocol.protocol_name,
            "category": categories.get(protocol_id, "unknown"),
        }
        for protocol_id, protocol in PROTOCOLS.items()
    ]
