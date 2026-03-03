import uuid


def new_conversation() -> str:
    return str(uuid.uuid4())
