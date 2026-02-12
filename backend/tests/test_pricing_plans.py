"""Test pricing plans configuration and yearly discount calculations."""
import unittest


class TestPricingPlans(unittest.TestCase):
    def setUp(self):
        from app.api.pricing import PRICING_PLANS
        self.plans = PRICING_PLANS

    def test_monthly_prices_correct(self):
        """Verify monthly plan prices match requirements."""
        basic = next(p for p in self.plans if p["id"] == "basic_monthly")
        pro = next(p for p in self.plans if p["id"] == "pro_monthly")
        unlimited = next(p for p in self.plans if p["id"] == "unlimited_monthly")
        credit_pack = next(p for p in self.plans if p["id"] == "credit_pack")

        self.assertEqual(basic["price_try"], 139)
        self.assertAlmostEqual(basic["price_usd"], 9.99)

        self.assertEqual(pro["price_try"], 399)
        self.assertAlmostEqual(pro["price_usd"], 24.99)

        self.assertEqual(unlimited["price_try"], 3999)
        self.assertEqual(unlimited["price_usd"], 199)

        self.assertEqual(credit_pack["price_try"], 79)
        self.assertAlmostEqual(credit_pack["price_usd"], 3.50)

    def test_yearly_prices_have_19pct_discount(self):
        """Verify yearly prices are monthly * 12 * 0.81 (19% discount)."""
        basic_y = next(p for p in self.plans if p["id"] == "basic_yearly")
        pro_y = next(p for p in self.plans if p["id"] == "pro_yearly")
        unlimited_y = next(p for p in self.plans if p["id"] == "unlimited_yearly")

        self.assertEqual(basic_y["price_try"], 1351)
        self.assertAlmostEqual(basic_y["price_usd"], 97.10, places=1)
        self.assertEqual(basic_y.get("discount_pct"), 19)

        self.assertEqual(pro_y["price_try"], 3878)
        self.assertAlmostEqual(pro_y["price_usd"], 242.90, places=1)
        self.assertEqual(pro_y.get("discount_pct"), 19)

        self.assertEqual(unlimited_y["price_try"], 38870)
        self.assertEqual(unlimited_y["price_usd"], 1934)
        self.assertEqual(unlimited_y.get("discount_pct"), 19)

    def test_all_plans_have_required_fields(self):
        """Every plan must have id, name, price_try, price_usd, credits."""
        for plan in self.plans:
            self.assertIn("id", plan)
            self.assertIn("name", plan)
            self.assertIn("price_try", plan)
            self.assertIn("price_usd", plan)
            self.assertIn("credits", plan)

    def test_dual_currency_locale_resolution(self):
        """Test _resolve_plan_for_locale works for both TRY and USD."""
        from app.api.pricing import _resolve_plan_for_locale

        plan = self.plans[1]  # basic_monthly
        resolved_tr = _resolve_plan_for_locale(plan, "tr", "TRY")
        resolved_en = _resolve_plan_for_locale(plan, "en", "USD")

        self.assertEqual(resolved_tr["currency"], "TRY")
        self.assertEqual(resolved_tr["price"], 139)

        self.assertEqual(resolved_en["currency"], "USD")
        self.assertAlmostEqual(resolved_en["price"], 9.99)

    def test_discount_pct_in_resolved_plan(self):
        """Resolved yearly plans should include discount_pct."""
        from app.api.pricing import _resolve_plan_for_locale
        basic_y = next(p for p in self.plans if p["id"] == "basic_yearly")
        resolved = _resolve_plan_for_locale(basic_y, "en", "USD")
        self.assertEqual(resolved.get("discount_pct"), 19)


if __name__ == "__main__":
    unittest.main()
