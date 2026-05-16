from django.db import models
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone


class LostItem(models.Model):
    class Status(models.TextChoices):
        UNCLAIMED = "unclaimed", "Unclaimed"
        CLAIMED = "claimed", "Claimed"
        RETURNED = "returned", "Returned"

    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80)
    description = models.TextField()
    location = models.CharField(max_length=160)
    date_found = models.DateField(default=timezone.localdate)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UNCLAIMED,
    )
    image_url = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_found", "-created_at"]

    def __str__(self):
        return self.name


class AdminAccount(models.Model):
    username = models.CharField(max_length=80, unique=True)
    password_hash = models.CharField(max_length=256)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return self.is_active and check_password(raw_password, self.password_hash)

    def __str__(self):
        return self.username


class UserSession(models.Model):
    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        ADMIN = "admin", "Admin"

    token = models.CharField(max_length=64, unique=True)
    role = models.CharField(max_length=20, choices=Role.choices)
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    admin = models.ForeignKey(AdminAccount, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.role}: {self.name}"


class Claim(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        HIGH = "high", "High"
        LOW = "low", "Low"

    item = models.ForeignKey(LostItem, related_name="claims", on_delete=models.CASCADE)
    claimant_name = models.CharField(max_length=120)
    claimant_email = models.EmailField()
    claimant_phone = models.CharField(max_length=40)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.HIGH,
    )
    created_by_token = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["priority", "-created_at"]

    def __str__(self):
        return f"{self.claimant_name} - {self.item.name}"


class GuestInquiry(models.Model):
    item = models.ForeignKey(LostItem, related_name="guest_inquiries", on_delete=models.CASCADE)
    contact_name = models.CharField(max_length=120)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=40, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.contact_name} - {self.item.name}"


class GlobalTemplate(models.Model):
    name = models.CharField(max_length=120)
    category = models.CharField(max_length=80)
    description = models.TextField()
    location = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

