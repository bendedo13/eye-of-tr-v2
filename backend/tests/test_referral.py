"""Test referral system reward logic."""
import unittest
from unittest.mock import MagicMock, patch


class TestReferralService(unittest.TestCase):
    def _make_user(self, user_id=1, email="test@test.com", referral_code="ABC123", referral_count=0):
        user = MagicMock()
        user.id = user_id
        user.email = email
        user.referral_code = referral_code
        user.referral_count = referral_count
        user.referred_by = None
        return user

    @patch("app.services.referral_service.CreditService")
    def test_3_referrals_awards_4_credits(self, mock_credit):
        """3 referrals should award 4 credits (1 detailed + 2 normal + 1 bonus)."""
        from app.services.referral_service import ReferralService

        db = MagicMock()
        referrer = self._make_user(user_id=1, referral_code="REF001", referral_count=2)
        new_user = self._make_user(user_id=2, email="new@test.com")

        db.query.return_value.filter.return_value.first.return_value = referrer

        result = ReferralService.process_referral(new_user, "REF001", db)
        self.assertTrue(result)
        # After increment, referral_count should be 3 (2+1), triggering reward
        self.assertEqual(referrer.referral_count, 3)
        mock_credit.add_credits.assert_called_once_with(referrer, db, 4, "referral_reward")

    @patch("app.services.referral_service.CreditService")
    def test_2_referrals_no_reward(self, mock_credit):
        """2 referrals should not trigger reward yet."""
        from app.services.referral_service import ReferralService

        db = MagicMock()
        referrer = self._make_user(user_id=1, referral_code="REF001", referral_count=1)
        new_user = self._make_user(user_id=2, email="new@test.com")

        db.query.return_value.filter.return_value.first.return_value = referrer

        result = ReferralService.process_referral(new_user, "REF001", db)
        self.assertTrue(result)
        mock_credit.add_credits.assert_not_called()

    def test_self_referral_blocked(self):
        """Users cannot refer themselves."""
        from app.services.referral_service import ReferralService

        db = MagicMock()
        user = self._make_user(user_id=1, referral_code="SELF01")
        db.query.return_value.filter.return_value.first.return_value = user

        result = ReferralService.process_referral(user, "SELF01", db)
        self.assertFalse(result)

    def test_invalid_referral_code(self):
        """Invalid referral codes return False."""
        from app.services.referral_service import ReferralService

        db = MagicMock()
        new_user = self._make_user(user_id=2)
        db.query.return_value.filter.return_value.first.return_value = None

        result = ReferralService.process_referral(new_user, "INVALID", db)
        self.assertFalse(result)

    def test_no_referral_code_returns_false(self):
        """Empty referral code returns False."""
        from app.services.referral_service import ReferralService

        db = MagicMock()
        new_user = self._make_user()
        result = ReferralService.process_referral(new_user, None, db)
        self.assertFalse(result)


if __name__ == "__main__":
    unittest.main()
