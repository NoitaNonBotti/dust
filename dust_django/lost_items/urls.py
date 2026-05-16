from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.api_health, name="api-health"),
    path("auth/gbox/", views.gbox_login, name="gbox-login"),
    path("auth/admin/", views.admin_login, name="admin-login"),
    path("auth/logout/", views.logout, name="logout"),
    path("lost-items/", views.lost_items_collection, name="lost-items-collection"),
    path("lost-items/<int:item_id>/", views.lost_item_detail, name="lost-item-detail"),
    path("claims/", views.claims_collection, name="claims-collection"),
    path("claims/<int:claim_id>/", views.claim_detail, name="claim-detail"),
    path("guest-inquiries/", views.guest_inquiries_collection, name="guest-inquiries-collection"),
    path("templates/global/", views.global_templates_collection, name="global-templates-collection"),
    path("templates/global/<int:template_id>/", views.global_template_detail, name="global-template-detail"),
]
