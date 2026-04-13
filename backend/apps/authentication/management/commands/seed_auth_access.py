from __future__ import annotations

import os

from django.core.management.base import BaseCommand

from domains.auth_access.infrastructure.bootstrap.auth_access_factories import (
    generate_auth_access_users,
)
from domains.auth_access.infrastructure.bootstrap.auth_access_seeders import (
    SeedSummary,
    seed_auth_access_base,
    seed_auth_access_demo,
    seed_auth_access_edge_cases,
)


class Command(BaseCommand):
    help = "Seed reproducible Auth-Access local data (base/demo/edge-cases/factory)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--base", action="store_true", help="Run mandatory base seeder."
        )
        parser.add_argument(
            "--demo", action="store_true", help="Run demo scenario seeder."
        )
        parser.add_argument(
            "--edge-cases",
            action="store_true",
            help="Run edge-case scenario seeder.",
        )
        parser.add_argument(
            "--factory-users",
            type=int,
            default=0,
            help="Generate synthetic users volume (e.g. 50-100).",
        )
        parser.add_argument(
            "--admin-password",
            type=str,
            default=None,
            help="Override admin password (default from AUTH_ACCESS_ADMIN_PASSWORD env).",
        )
        parser.add_argument(
            "--factory-seed",
            type=int,
            default=42,
            help="Deterministic random seed for factories.",
        )
        parser.add_argument(
            "--quiet", action="store_true", help="Suppress verbose output."
        )

    def handle(self, *args, **options):
        run_base = options["base"]
        run_demo = options["demo"]
        run_edge_cases = options["edge_cases"]

        if not (run_base or run_demo or run_edge_cases or options["factory_users"] > 0):
            run_base = True

        admin_password = options["admin_password"] or os.getenv(
            "AUTH_ACCESS_ADMIN_PASSWORD",
            "Admin_ChangeMe_123456",
        )

        summary = SeedSummary()

        if run_base:
            summary = summary.merge(
                seed_auth_access_base(admin_password=admin_password)
            )
            if not options["quiet"]:
                self.stdout.write(
                    self.style.SUCCESS("[seed_auth_access] Base seeder completed.")
                )

        if run_demo:
            summary = summary.merge(seed_auth_access_demo())
            if not options["quiet"]:
                self.stdout.write(
                    self.style.SUCCESS("[seed_auth_access] Demo seeder completed.")
                )

        if run_edge_cases:
            summary = summary.merge(seed_auth_access_edge_cases())
            if not options["quiet"]:
                self.stdout.write(
                    self.style.SUCCESS(
                        "[seed_auth_access] Edge-cases seeder completed."
                    )
                )

        if options["factory_users"] > 0:
            summary = summary.merge(
                generate_auth_access_users(
                    amount=options["factory_users"],
                    random_seed=options["factory_seed"],
                )
            )
            if not options["quiet"]:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[seed_auth_access] Factory generation completed ({options['factory_users']} users)."
                    )
                )

        self.stdout.write(
            self.style.NOTICE(
                "[seed_auth_access] Summary: "
                f"users={summary.created_users}, "
                f"roles={summary.created_roles}, "
                f"permissions={summary.created_permissions}, "
                f"role_permissions={summary.created_role_permissions}, "
                f"user_roles={summary.created_user_roles}, "
                f"overrides={summary.created_overrides}"
            )
        )
