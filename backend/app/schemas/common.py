from pydantic import BaseModel


class Page[T](BaseModel):
    """Envelope for paginated list responses, reused across resources."""

    items: list[T]
    total: int
    page: int
    page_size: int
