"""Pricing service for managing pricing plans with database overrides"""
import logging
import json
from sqlalchemy.orm import Session
from typing import Optional
from copy import deepcopy

from app.models.cms import SiteSetting
from app.api.pricing import PRICING_PLANS

logger = logging.getLogger(__name__)


class PricingService:
    """Service for managing pricing plans with database overrides."""
    
    @staticmethod
    def _load_plans(db: Session) -> list[dict]:
        row = db.query(SiteSetting).filter(SiteSetting.key == "pricing.plans").first()
        if row:
            try:
                data = json.loads(row.value_json)
                if isinstance(data, list):
                    return data
            except Exception:
                pass
        return deepcopy(PRICING_PLANS)

    @staticmethod
    def _save_plans(db: Session, plans: list[dict]) -> None:
        row = db.query(SiteSetting).filter(SiteSetting.key == "pricing.plans").first()
        value_json = json.dumps(plans, ensure_ascii=False)
        if row:
            row.value_json = value_json
        else:
            row = SiteSetting(key="pricing.plans", value_json=value_json)
            db.add(row)
        db.commit()

    @staticmethod
    def get_plan(plan_id: str, db: Session) -> Optional[dict]:
        plans = PricingService._load_plans(db)
        base_plan = next((p for p in plans if p["id"] == plan_id), None)
        
        if not base_plan:
            logger.warning(f"Plan not found: {plan_id}")
            return None
        
        return deepcopy(base_plan)
    
    @staticmethod
    def get_all_plans(db: Session) -> list[dict]:
        return PricingService._load_plans(db)

    
    @staticmethod
    def save_plan(plan_payload: dict, db: Session) -> dict:
        plans = PricingService._load_plans(db)
        plan_id = plan_payload.get("id")
        if not plan_id:
            raise ValueError("Plan id is required")
        existing_idx = next((idx for idx, plan in enumerate(plans) if plan.get("id") == plan_id), None)
        if existing_idx is None:
            plans.append(deepcopy(plan_payload))
        else:
            plans[existing_idx] = deepcopy(plan_payload)
        PricingService._save_plans(db, plans)
        return deepcopy(plan_payload)

    @staticmethod
    def delete_plan(plan_id: str, db: Session) -> bool:
        plans = PricingService._load_plans(db)
        next_plans = [plan for plan in plans if plan.get("id") != plan_id]
        if len(next_plans) == len(plans):
            return False
        PricingService._save_plans(db, next_plans)
        return True

    @staticmethod
    def reset_to_defaults(db: Session) -> list[dict]:
        PricingService._save_plans(db, deepcopy(PRICING_PLANS))
        return PricingService._load_plans(db)
