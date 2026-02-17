import builtins
from unittest.mock import patch

from django.test import SimpleTestCase

import manage


class ManageTests(SimpleTestCase):
    def test_main_raises_helpful_import_error_when_django_missing(self):
        original_import = builtins.__import__

        def fake_import(name, globals=None, locals=None, fromlist=(), level=0):
            if name == "django.core.management":
                raise ImportError("missing django")
            return original_import(name, globals, locals, fromlist, level)

        with patch("builtins.__import__", side_effect=fake_import):
            __import__("json")
            with self.assertRaises(ImportError) as ctx:
                manage.main()

        self.assertIn("Couldn't import Django", str(ctx.exception))
