import re

from django.conf import settings

_LOCAL_DEV_ORIGIN = re.compile(r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$")


def _is_allowed_dev_origin(origin: str | None) -> bool:
    if not origin:
        return False
    if not settings.DEBUG:
        return origin in {
            "http://localhost:5174",
            "http://localhost:5174",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5173",
        }
    return bool(_LOCAL_DEV_ORIGIN.match(origin))


class LocalDevCorsMiddleware:
    """Allow the Vite dev server to call the Django example API."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        origin = request.headers.get("Origin")

        if _is_allowed_dev_origin(origin):
            response["Access-Control-Allow-Origin"] = origin
            response["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Content-Type, X-DUST-SESSION"

        return response
