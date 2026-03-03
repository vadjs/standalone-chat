import app.store as store


def test_new_conversation_returns_string():
    cid = store.new_conversation()
    assert isinstance(cid, str)


def test_new_conversation_returns_unique_ids():
    cid1 = store.new_conversation()
    cid2 = store.new_conversation()
    assert cid1 != cid2
