"""Pricing service for managing pricing plans with database overrides"""
import logging
from sqlalchemy.orm import Session
from typing import Optional
from copy import deepcopy

from app.models.pricing import PricingOverride
from app.api.pricing import PRICING_PLANS

logger = logging.getLogger(__name__)


class PricingService:
    """Service for managing pricing plans with database overrides.
    
    This service applies database overrides to hardcoded PRICING_PLANS defaults,
    allowing dynamic pricing management through the admin panel while maintaining
    backward compatibility with hardcoded defaults.
    """
    
    @staticmethod
    def get_plan(plan_id: str, db: Session) -> Optional[dict]:
        """Get a single plan with database overrides applied.
        
        Args:
            plan_id: The plan identifier (e.g., "basic_monthly", "credit_pack")
            db: Database session
            
        Returns:
            Plan dictionary with overrides applied, or None if plan not found
        """
        # Find the base plan from PRICING_PLANS
        base_plan = next((p for p in PRICING_PLANS if p["id"] == plan_id), None)
        
        if not base_plan:
            logger.warning(f"Plan not found: {plan_id}")
            return None
        
        # Create a deep copy to avoid modifying the original
        plan = deepcopy(base_plan)
        
        # Check for database overrides
        override = db.query(PricingOverride).filter(
            PricingOverride.plan_id == plan_id
        ).first()
        
        if override:
            # Apply overrides (only non-NULL values)
            if override.price_try is not None:
                plan["price_try"] = override.price_try
            if override.price_usd is not None:
                plan["price_usd"] = override.price_usd
            if override.credits is not None:
                plan["credits"] = override.credits
            if override.search_normal is not None:
                plan["search_normal"] = override.search_normal
            if override.search_detailed is not None:
                plan["search_detailed"] = override.search_detailed
            if override.search_location is not None:
                plan["search_location"] = override.search_location
            
            logger.debug(f"Applied overrides to plan {plan_id}")
        
        return plan
    
    @staticmethod
    def get_all_plans(db: Session) -> list[dict]:
        """Get all plans with database overrides applied.
        
        Args:
            db: Database session
            
        Returns:
            List of plan dictionaries with overrides applied
        """
        plans = []
        
        for base_plan in PRICING_PLANS:
            plan = PricingService.get_plan(base_plan["id"], db)
            if plan:
                plans.append(plan)
        
        return plans

    
    @staticmethod
    def update_plan_pricing(
        plan_id: str,
        price_try: Optional[float],
        price_usd: Optional[float],
        db: Session,
        admin_user_id: int
    ) -> dict:
        """Update pricing for a specific plan.
        
        Args:
            plan_id: The plan identifier
            price_try: New TRY price (None to keep default)
            price_usd: New USD price (None to keep default)
            db: Database session
            admin_user_id: ID of the admin user making the change
            
        Returns:
            Updated plan dictionary with overrides applied
            
        Raises:
            ValueError: If plan not found or prices are invalid
        """
        # Verify plan exists
        base_plan = next((p for p in PRICING_PLANS if p["id"] == plan_id), None)
        if not base_plan:
            raise ValueError(f"Plan not found: {plan_id}")
        
        # Validate prices (must be positive if provided)
        if price_try is not None and price_try < 0:
            raise ValueError("price_try must be a positive number")
        if price_usd is not None and price_usd < 0:
            raise ValueError("price_usd must be a positive number")
        
        # Find or create override record
        override = db.query(PricingOverride).filter(
            PricingOverride.plan_id == plan_id
        ).first()
        
        if not override:
            override = PricingOverride(
                plan_id=plan_id,
                updated_by=admin_user_id
            )
            db.add(override)
        
        # Update override values
        if price_try is not None:
            override.price_try = price_try
        if price_usd is not None:
            override.price_usd = price_usd
        override.updated_by = admin_user_id
        
        db.commit()
        db.refresh(override)
        
        logger.info(
            f"Updated pricing for plan {plan_id}: "
            f"TRY={price_try}, USD={price_usd}, admin_id={admin_user_id}"
        )
        
        # Return the updated plan
        return PricingService.get_plan(plan_id, db)
    
    @staticmethod
    def reset_plan_pricing(plan_id: str, db: Session) -> dict:
        """Reset plan pricing to defaults by removing database overrides.
        
        Args:
            plan_id: The plan identifier
            db: Database session
            
        Returns:
            Plan dictionary with default values
            
        Raises:
            ValueError: If plan not found
        """
        # Verify plan exists
        base_plan = next((p for p in PRICING_PLANS if p["id"] == plan_id), None)
        if not base_plan:
            raise ValueError(f"Plan not found: {plan_id}")
        
        # Delete override if it exists
        override = db.query(PricingOverride).filter(
            PricingOverride.plan_id == plan_id
        ).first()
        
        if override:
            db.delete(override)
            db.commit()
            logger.info(f"Reset pricing for plan {plan_id} to defaults")
        else:
            logger.debug(f"No override found for plan {plan_id}, already using defaults")
        
        # Return the plan with default values
        return deepcopy(base_plan)
