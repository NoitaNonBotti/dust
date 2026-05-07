import json
from pathlib import Path
from uuid import uuid4

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import LostItem


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
TEMP_ADMIN_PASSWORD = "password"


def homepage(request):
    return render(request, "lost_items/homepage.html")


def serialize_lost_item(item):
    return {
        "id": str(item.id),
        "name": item.name,
        "category": item.category,
        "description": item.description,
        "location": item.location,
        "dateFound": item.date_found.isoformat(),
        "status": item.status,
        "imageUrl": item.image_url,
    }


def api_health(request):
    return JsonResponse({"ok": True, "service": "dust_django"})


def parse_lost_item_payload(request):
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        return request.POST, request.FILES.get("image")

    try:
        return json.loads(request.body.decode("utf-8") or "{}"), None
    except json.JSONDecodeError:
        return None, None


def save_uploaded_image(uploaded_file):
    if uploaded_file is None:
        return ""

    extension = ALLOWED_IMAGE_TYPES.get(uploaded_file.content_type)
    if extension is None:
        raise ValueError("Image must be a JPEG, PNG, GIF, or WebP file.")

    image_dir = Path(settings.MEDIA_ROOT) / "lost_items"
    image_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid4().hex}{extension}"
    image_path = image_dir / filename

    with image_path.open("wb") as destination:
        for chunk in uploaded_file.chunks():
            destination.write(chunk)

    return f"{settings.MEDIA_URL}lost_items/{filename}"


def is_admin_request(request):
    return request.headers.get("X-DUST-ADMIN-PASSWORD") == TEMP_ADMIN_PASSWORD


def apply_lost_item_payload(item, payload, uploaded_image=None):
    if payload.get("name") is not None:
        item.name = payload["name"].strip()
    if payload.get("category") is not None:
        item.category = payload["category"].strip()
    if payload.get("description") is not None:
        item.description = payload["description"].strip()
    if payload.get("location") is not None:
        item.location = payload["location"].strip()
    if payload.get("dateFound"):
        item.date_found = parse_date(payload["dateFound"]) or item.date_found
    if payload.get("status") is not None:
        if payload["status"] not in LostItem.Status.values:
            raise ValueError("Invalid item status.")
        item.status = payload["status"]

    image_url = save_uploaded_image(uploaded_image)
    if image_url:
        item.image_url = image_url
    elif payload.get("imageUrl") is not None:
        item.image_url = payload["imageUrl"].strip()

    item.save()
    return item


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def lost_items_collection(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if request.method == "GET":
        items = LostItem.objects.all()
        return JsonResponse({"items": [serialize_lost_item(item) for item in items]})

    payload, uploaded_image = parse_lost_item_payload(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    required_fields = ["name", "category", "description", "location"]
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return JsonResponse(
            {"error": "Missing required fields.", "fields": missing_fields},
            status=400,
        )

    try:
        image_url = save_uploaded_image(uploaded_image)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)

    date_found = parse_date(payload.get("dateFound", ""))
    item = LostItem.objects.create(
        name=payload["name"].strip(),
        category=payload["category"].strip(),
        description=payload["description"].strip(),
        location=payload["location"].strip(),
        date_found=date_found or timezone.localdate(),
        image_url=image_url or (payload.get("imageUrl") or "").strip(),
    )
    return JsonResponse(serialize_lost_item(item), status=201)


@csrf_exempt
@require_http_methods(["PATCH", "DELETE", "OPTIONS"])
def lost_item_detail(request, item_id):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if not is_admin_request(request):
        return JsonResponse({"error": "Admin password is required."}, status=401)

    item = get_object_or_404(LostItem, id=item_id)

    if request.method == "DELETE":
        item.delete()
        return JsonResponse({"deleted": True})

    payload, uploaded_image = parse_lost_item_payload(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    try:
        updated_item = apply_lost_item_payload(item, payload, uploaded_image)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=400)

    return JsonResponse(serialize_lost_item(updated_item))
