"""Test simplified pricing plans configuration."""
import unittest


class TestPricingPlans(unittest.TestCase):
    def setUp(self):
        from app.api.pricing import PRICING_PLANS

        self.plans = PRICING_PLANS

    def test_only_basic_and_credit_plans_exist(self):
        ids = {p["id"] for p in self.plans}
        self.assertEqual(ids, {"basic_monthly", "credit_pack"})

    def test_prices_match_defaults(self):
        basic = next(p for p in self.plans if p["id"] == "basic_monthly")
        credit = next(p for p in self.plans if p["id"] == "credit_pack")

        self.assertEqual(basic["price_try"], 299)
        self.assertAlmostEqual(basic["price_usd"], 14.99)

        self.assertEqual(credit["price_try"], 59.99)
        self.assertAlmostEqual(credit["price_usd"], 2.99)

    def test_all_plans_have_required_fields(self):
        for plan in self.plans:
            self.assertIn("id", plan)
            self.assertIn("name", plan)
            self.assertIn("price_try", plan)
            self.assertIn("price_usd", plan)
            self.assertIn("credits", plan)

    def test_locale_resolution_works(self):
        from app.api.pricing import _resolve_plan_for_locale

        basic = next(p for p in self.plans if p["id"] == "basic_monthly")
        resolved_tr = _resolve_plan_for_locale(basic, "tr", "TRY")
        resolved_en = _resolve_plan_for_locale(basic, "en", "USD")

        self.assertEqual(resolved_tr["currency"], "TRY")
        self.assertEqual(resolved_tr["price"], 299)

        self.assertEqual(resolved_en["currency"], "USD")
        self.assertAlmostEqual(resolved_en["price"], 14.99)
