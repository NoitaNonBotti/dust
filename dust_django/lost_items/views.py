import json
import os
from pathlib import Path
from secrets import token_hex
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen
from uuid import uuid4

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.shortcuts import render
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import AdminAccount, Claim, GlobalTemplate, GuestInquiry, LostItem, UserSession


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
}
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
GBOX_ALLOWED_DOMAIN = os.environ.get("GBOX_ALLOWED_DOMAIN", "")


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
        "claims": [serialize_claim(claim) for claim in item.claims.all()],
    }


def serialize_claim(claim):
    return {
        "id": str(claim.id),
        "itemId": str(claim.item_id),
        "claimantName": claim.claimant_name,
        "claimantEmail": claim.claimant_email,
        "claimantPhone": claim.claimant_phone,
        "description": claim.description,
        "dateSubmitted": claim.created_at.date().isoformat(),
        "status": claim.status,
        "priority": claim.priority,
        "createdByToken": claim.created_by_token,
    }


def create_claim_for_item(item, payload, *, session=None):
    if session:
        priority = Claim.Priority.HIGH
        created_by_token = session.token
    else:
        priority = Claim.Priority.LOW
        created_by_token = ""

    return Claim.objects.create(
        item=item,
        claimant_name=payload["claimantName"].strip(),
        claimant_email=payload["claimantEmail"].strip(),
        claimant_phone=(payload.get("claimantPhone") or "").strip(),
        description=payload["description"].strip(),
        priority=priority,
        created_by_token=created_by_token,
    )


def serialize_template(template):
    return {
        "id": f"global-{template.id}",
        "backendId": str(template.id),
        "scope": "global",
        "name": template.name,
        "categories": [template.category],
        "description": template.description,
        "location": template.location,
    }


def serialize_session(session):
    return {
        "token": session.token,
        "role": session.role,
        "name": session.name,
        "email": session.email,
    }


def api_health(request):
    return JsonResponse({"ok": True, "service": "dust_django"})


def parse_json_body(request):
    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return None


def verify_google_id_token(credential):
    if not GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID is not configured on the Django backend.")

    query = urlencode({"id_token": credential})
    try:
        with urlopen(f"https://oauth2.googleapis.com/tokeninfo?{query}", timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (URLError, TimeoutError, json.JSONDecodeError) as error:
        raise ValueError("Could not verify Google credential.") from error

    if payload.get("aud") != GOOGLE_CLIENT_ID:
        raise ValueError("Google credential was not issued for this app.")
    if payload.get("email_verified") not in ["true", True]:
        raise ValueError("Google account email is not verified.")

    email = (payload.get("email") or "").strip().lower()
    if not email:
        raise ValueError("Google credential did not include an email.")
    if GBOX_ALLOWED_DOMAIN and not email.endswith(GBOX_ALLOWED_DOMAIN):
        raise ValueError("Email is not part of the allowed GBox domain.")

    return {
        "email": email,
        "name": payload.get("name") or email,
    }


def create_session(role, name, email="", admin=None):
    session = UserSession.objects.create(
        token=token_hex(32),
        role=role,
        name=name,
        email=email,
        admin=admin,
    )
    return session


def get_session(request):
    token = request.headers.get("X-DUST-SESSION", "")
    if not token:
        return None
    return UserSession.objects.filter(token=token).first()


def require_session(request, roles):
    session = get_session(request)
    if session is None or session.role not in roles:
        return None
    return session


def is_admin_request(request):
    return require_session(request, [UserSession.Role.ADMIN]) is not None


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

    if require_session(request, [UserSession.Role.STUDENT, UserSession.Role.ADMIN]) is None:
        return JsonResponse({"error": "Student or admin login is required to report items."}, status=401)

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
        return JsonResponse({"error": "Admin login is required."}, status=401)

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


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def gbox_login(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    credential = payload.get("credential") or ""
    if not credential:
        return JsonResponse({"error": "Google credential is required."}, status=400)

    try:
        google_user = verify_google_id_token(credential)
    except ValueError as error:
        return JsonResponse({"error": str(error)}, status=401)

    session = create_session(
        UserSession.Role.STUDENT,
        name=google_user["name"],
        email=google_user["email"],
    )
    return JsonResponse({"user": serialize_session(session)})


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def admin_login(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    admin = AdminAccount.objects.filter(username=username, is_active=True).first()
    if admin is None or not admin.check_password(password):
        return JsonResponse({"error": "Invalid admin username or password."}, status=401)

    session = create_session(UserSession.Role.ADMIN, name=username, admin=admin)
    return JsonResponse({"user": serialize_session(session)})


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def logout(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    session = get_session(request)
    if session:
        session.delete()
    return JsonResponse({"ok": True})


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def claims_collection(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    session = get_session(request)
    if session and session.role not in [UserSession.Role.STUDENT, UserSession.Role.ADMIN]:
        return JsonResponse({"error": "Student or admin login is required to file a claim."}, status=401)

    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    required_fields = ["itemId", "claimantName", "claimantEmail", "description"]
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return JsonResponse({"error": "Missing required fields.", "fields": missing_fields}, status=400)

    item = get_object_or_404(LostItem, id=payload["itemId"])
    claim = create_claim_for_item(item, payload, session=session)
    return JsonResponse(serialize_claim(claim), status=201)


@csrf_exempt
@require_http_methods(["PATCH", "OPTIONS"])
def claim_detail(request, claim_id):
    if request.method == "OPTIONS":
        return JsonResponse({})

    session = get_session(request)
    if session is None:
        return JsonResponse({"error": "Login is required."}, status=401)

    claim = get_object_or_404(Claim, id=claim_id)
    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    next_status = payload.get("status")
    if next_status not in Claim.Status.values:
        return JsonResponse({"error": "Invalid claim status."}, status=400)

    is_admin = session.role == UserSession.Role.ADMIN
    is_owner = claim.created_by_token == session.token
    if next_status in [Claim.Status.APPROVED, Claim.Status.REJECTED] and not is_admin:
        return JsonResponse({"error": "Admin login is required to approve or reject claims."}, status=401)
    if next_status == Claim.Status.CANCELLED and not (is_admin or is_owner):
        return JsonResponse({"error": "Only the claim owner or an admin can cancel this claim."}, status=403)

    claim.status = next_status
    claim.save()
    if next_status == Claim.Status.APPROVED:
        claim.item.status = LostItem.Status.CLAIMED
        claim.item.save()

    return JsonResponse(serialize_claim(claim))


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def guest_inquiries_collection(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    required_fields = ["itemId", "contactName", "contactEmail", "message"]
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return JsonResponse({"error": "Missing required fields.", "fields": missing_fields}, status=400)

    item = get_object_or_404(LostItem, id=payload["itemId"])
    claim_payload = {
        "claimantName": payload["contactName"],
        "claimantEmail": payload["contactEmail"],
        "claimantPhone": payload.get("contactPhone") or "",
        "description": payload["message"],
    }
    claim = create_claim_for_item(item, claim_payload, session=None)
    GuestInquiry.objects.create(
        item=item,
        contact_name=claim_payload["claimantName"],
        contact_email=claim_payload["claimantEmail"],
        contact_phone=claim_payload["claimantPhone"],
        message=claim_payload["description"],
    )
    return JsonResponse(serialize_claim(claim), status=201)


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def global_templates_collection(request):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if request.method == "GET":
        templates = GlobalTemplate.objects.all()
        return JsonResponse({"templates": [serialize_template(template) for template in templates]})

    if not is_admin_request(request):
        return JsonResponse({"error": "Admin login is required."}, status=401)

    payload = parse_json_body(request)
    if payload is None:
        return JsonResponse({"error": "Invalid JSON body."}, status=400)

    required_fields = ["name", "category", "description"]
    missing_fields = [field for field in required_fields if not payload.get(field)]
    if missing_fields:
        return JsonResponse({"error": "Missing required fields.", "fields": missing_fields}, status=400)

    template = GlobalTemplate.objects.create(
        name=payload["name"].strip(),
        category=payload["category"].strip(),
        description=payload["description"].strip(),
        location=(payload.get("location") or "").strip(),
    )
    return JsonResponse(serialize_template(template), status=201)


@csrf_exempt
@require_http_methods(["DELETE", "OPTIONS"])
def global_template_detail(request, template_id):
    if request.method == "OPTIONS":
        return JsonResponse({})

    if not is_admin_request(request):
        return JsonResponse({"error": "Admin login is required."}, status=401)

    template = get_object_or_404(GlobalTemplate, id=template_id)
    template.delete()
    return JsonResponse({"deleted": True})
