from django.urls import path

from . import views


urlpatterns = [
    path("health/", views.api_health, name="api-health"),
    path("lost-items/", views.lost_items_collection, name="lost-items-collection"),
    path("lost-items/<int:item_id>/", views.lost_item_detail, name="lost-item-detail"),
]
