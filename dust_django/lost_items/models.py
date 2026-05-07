from django.db import models
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

