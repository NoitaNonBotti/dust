from getpass import getpass

from django.core.management.base import BaseCommand, CommandError

from lost_items.models import AdminAccount


class Command(BaseCommand):
    help = "Create or reset a DUST admin account for the React admin login."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("--password", help="Admin password. If omitted, you will be prompted.")

    def handle(self, *args, **options):
        username = options["username"].strip()
        password = options.get("password") or getpass("Admin password: ")

        if not username:
            raise CommandError("Username is required.")
        if not password:
            raise CommandError("Password is required.")

        admin, created = AdminAccount.objects.get_or_create(username=username)
        admin.set_password(password)
        admin.is_active = True
        admin.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(f"{action} DUST admin account: {username}"))
