from django.contrib import admin

from .models import AdminAccount, Claim, GlobalTemplate, GuestInquiry, LostItem, UserSession


@admin.register(LostItem)
class LostItemAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "location", "status", "date_found")
    list_filter = ("status", "category", "date_found")
    search_fields = ("name", "description", "location", "category")


@admin.register(AdminAccount)
class AdminAccountAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "created_at")
    search_fields = ("username",)


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ("name", "role", "email", "created_at")
    list_filter = ("role",)
    search_fields = ("name", "email")


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ("claimant_name", "item", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("claimant_name", "claimant_email", "item__name")


@admin.register(GuestInquiry)
class GuestInquiryAdmin(admin.ModelAdmin):
    list_display = ("contact_name", "item", "contact_email", "created_at")
    search_fields = ("contact_name", "contact_email", "item__name")


@admin.register(GlobalTemplate)
class GlobalTemplateAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "location", "created_at")
    search_fields = ("name", "category", "description")

