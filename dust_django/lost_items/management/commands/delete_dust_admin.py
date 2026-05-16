from django.core.management.base import BaseCommand, CommandError

from lost_items.models import AdminAccount


class Command(BaseCommand):
    help = "Delete a DUST admin account."

    def add_arguments(self, parser):
        parser.add_argument("username")

    def handle(self, *args, **options):
        username = options["username"].strip()
        deleted, _ = AdminAccount.objects.filter(username=username).delete()

        if deleted == 0:
            raise CommandError(f"No DUST admin account found for: {username}")

        self.stdout.write(self.style.SUCCESS(f"Deleted DUST admin account: {username}"))
