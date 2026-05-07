from django.contrib import admin

from .models import LostItem


@admin.register(LostItem)
class LostItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "location", "status", "date_found")
    list_filter = ("status", "category", "date_found")
    search_fields = ("name", "description", "location", "category")

