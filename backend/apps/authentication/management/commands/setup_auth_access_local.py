from __future__ import annotations

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "One-shot local setup for Auth-Access: migrate + base seed (+ optional scenarios)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--with-demo",
            action="store_true",
            help="Run demo seeder after base seeder.",
        )
        parser.add_argument(
            "--with-edge-cases",
            action="store_true",
            help="Run edge-cases seeder after base seeder.",
        )
        parser.add_argument(
            "--factory-users",
            type=int,
            default=0,
            help="Generate synthetic users amount (optional).",
        )
        parser.add_argument(
            "--admin-password",
            type=str,
            default=None,
            help="Override admin password for base seeder.",
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.NOTICE("[setup_auth_access_local] Running migrations...")
        )
        call_command("migrate")

        self.stdout.write(
            self.style.NOTICE(
                "[setup_auth_access_local] Running mandatory base seeder..."
            )
        )
        seed_args = ["--base"]

        if options["with_demo"]:
            seed_args.append("--demo")
        if options["with_edge_cases"]:
            seed_args.append("--edge-cases")
        if options["factory_users"] > 0:
            seed_args.extend(["--factory-users", str(options["factory_users"])])
        if options["admin_password"]:
            seed_args.extend(["--admin-password", options["admin_password"]])

        call_command("seed_auth_access", *seed_args)
        self.stdout.write(
            self.style.SUCCESS(
                "[setup_auth_access_local] Auth-Access local setup completed."
            )
        )
