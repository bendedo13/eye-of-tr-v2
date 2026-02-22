"""Test credit system logic."""
import unittest
from unittest.mock import MagicMock


class TestCreditService(unittest.TestCase):
    def _make_user(self, credits=5, tier="basic"):
        user = MagicMock()
        user.credits = credits
        user.tier = tier
        return user

    def test_has_credits_with_positive_balance(self):
        from app.services.credit_service import CreditService
        user = self._make_user(credits=5)
        self.assertTrue(CreditService.has_credits(user))

    def test_has_credits_with_zero_balance(self):
        from app.services.credit_service import CreditService
        user = self._make_user(credits=0)
        self.assertFalse(CreditService.has_credits(user))

    def test_consume_credit_decrements(self):
        from app.services.credit_service import CreditService
        user = self._make_user(credits=5, tier="basic")
        db = MagicMock()
        result = CreditService.consume_credit(user, db, 1)
        self.assertTrue(result)
        self.assertEqual(user.credits, 4)

    def test_consume_credit_fails_when_empty(self):
        from app.services.credit_service import CreditService
        user = self._make_user(credits=0, tier="basic")
        db = MagicMock()
        result = CreditService.consume_credit(user, db, 1)
        self.assertFalse(result)

    def test_add_credits(self):
        from app.services.credit_service import CreditService
        user = self._make_user(credits=5)
        db = MagicMock()
        CreditService.add_credits(user, db, 10, "test")
        self.assertEqual(user.credits, 15)


class TestAlanSearchCredits(unittest.TestCase):
    def test_new_user_gets_1_alan_search_credit(self):
        """New users should have 1 free AlanSearch credit by default."""
        from app.models.user import User
        # Check the column default
        col = User.__table__.columns["alan_search_credits"]
        self.assertEqual(col.default.arg, 1)

    def test_new_user_gets_1_regular_credit(self):
        """New users should have 1 free regular credit by default."""
        from app.models.user import User
        col = User.__table__.columns["credits"]
        self.assertEqual(col.default.arg, 1)


if __name__ == "__main__":
    unittest.main()
