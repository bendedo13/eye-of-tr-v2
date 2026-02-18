# Implementation Plan: Pricing and Credit Fixes

## Overview

This implementation plan addresses three interconnected issues:
1. Update hardcoded pricing values to new pricing structure
2. Implement database-backed pricing management with admin UI
3. Fix AlanSearch credit initialization bug for new users

The implementation follows a logical progression: database schema → backend services → API endpoints → frontend UI → testing.

## Tasks

- [x] 1. Create database schema for pricing overrides
  - Create migration file for `pricing_overrides` table
  - Add columns: id, plan_id, price_try, price_usd, credits, search_normal, search_detailed, search_location, updated_by, updated_at
  - Add unique constraint on plan_id
  - Add foreign key to users table for updated_by
  - _Requirements: 2.3, 4.1_

- [ ] 2. Create PricingOverride model
  - [x] 2.1 Implement PricingOverride SQLAlchemy model
    - Define model in `backend/app/models/pricing.py`
    - Add relationship to User model for updater
    - Include all fields from schema
    - _Requirements: 2.3, 4.1_
  
  - [ ]* 2.2 Write unit tests for PricingOverride model
    - Test model creation
    - Test unique constraint on plan_id
    - Test relationship to User
    - _Requirements: 5.4_

- [ ] 3. Update hardcoded pricing values
  - [x] 3.1 Update PRICING_PLANS constant in backend/app/api/pricing.py
    - Change basic_monthly: price_try to 299, price_usd to 14.99
    - Change credit_pack: price_try to 59.99, price_usd to 2.99
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 3.2 Write property test for pricing values
    - **Property 7: Currency-Specific Pricing (TRY)**
    - **Property 8: Currency-Specific Pricing (USD)**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [ ] 4. Implement PricingService
  - [x] 4.1 Create PricingService class in backend/app/services/pricing_service.py
    - Implement get_plan(plan_id, db) method
    - Implement get_all_plans(db) method
    - Implement update_plan_pricing(plan_id, price_try, price_usd, db, admin_user_id) method
    - Implement reset_plan_pricing(plan_id, db) method
    - Apply database overrides to PRICING_PLANS defaults
    - _Requirements: 2.3, 2.4, 2.5, 4.1, 4.3_
  
  - [ ]* 4.2 Write property tests for PricingService
    - **Property 1: Pricing Override Consistency**
    - **Property 2: Default Fallback Integrity**
    - **Validates: Requirements 2.4, 2.5, 4.3**
  
  - [ ]* 4.3 Write unit tests for PricingService
    - Test get_plan with override present
    - Test get_plan with no override (fallback to default)
    - Test update_plan_pricing with valid values
    - Test update_plan_pricing with negative values (should fail)
    - Test reset_plan_pricing
    - _Requirements: 5.1, 5.4_

- [ ] 5. Update existing pricing API endpoints
  - [x] 5.1 Modify GET /api/pricing/plans endpoint
    - Replace direct PRICING_PLANS usage with PricingService.get_all_plans()
    - Maintain existing response format
    - _Requirements: 2.4, 4.3_
  
  - [x] 5.2 Modify GET /api/pricing/plans-grouped endpoint
    - Replace direct PRICING_PLANS usage with PricingService.get_all_plans()
    - Maintain existing response format
    - _Requirements: 2.4, 4.3_
  
  - [ ]* 5.3 Write property test for pricing API consistency
    - **Property 10: Pricing API Response Format Consistency**
    - **Validates: Requirements 4.3**

- [x] 6. Checkpoint - Ensure pricing service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement admin pricing management API
  - [x] 7.1 Add GET /api/admin/pricing endpoint
    - Return all plans with override status indicator
    - Include both database and default values
    - Require admin authentication
    - _Requirements: 2.1, 2.6_
  
  - [x] 7.2 Add PUT /api/admin/pricing/{plan_id} endpoint
    - Validate price values are positive numbers
    - Update or create pricing_overrides record
    - Record admin user ID and timestamp
    - Return updated plan data
    - _Requirements: 2.2, 2.3, 4.4_
  
  - [x] 7.3 Add DELETE /api/admin/pricing/{plan_id} endpoint
    - Remove pricing override for specified plan
    - Return default plan data
    - _Requirements: 2.5_
  
  - [ ]* 7.4 Write property tests for admin pricing API
    - **Property 6: Price Update Validation**
    - **Property 9: Admin Audit Trail**
    - **Validates: Requirements 2.2, 4.4**
  
  - [ ]* 7.5 Write unit tests for admin pricing endpoints
    - Test GET returns all plans with status
    - Test PUT with valid data updates database
    - Test PUT with negative price fails validation
    - Test DELETE removes override
    - Test unauthorized access is rejected
    - _Requirements: 5.4_

- [ ] 8. Fix AlanSearch credit initialization bug
  - [x] 8.1 Update user registration in backend/app/api/auth.py
    - Explicitly set alan_search_credits=1 in User constructor
    - Ensure credits=1 is also set (already present)
    - _Requirements: 3.1_
  
  - [ ]* 8.2 Write property test for new user credit initialization
    - **Property 3: New User Credit Initialization**
    - **Validates: Requirements 3.1**
  
  - [ ]* 8.3 Write unit tests for user registration
    - Test new user has alan_search_credits = 1
    - Test new user has credits = 1
    - Test referral code doesn't affect alan_search_credits
    - _Requirements: 5.2_

- [ ] 9. Verify AlanSearch credit validation logic
  - [x] 9.1 Review and document AlanSearch credit check in backend/app/api/alan_search.py
    - Verify credit check logic is correct (already correct, just needs user initialization fix)
    - Add comments explaining the validation flow
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ]* 9.2 Write property tests for AlanSearch credit consumption
    - **Property 4: Credit Consumption Validation**
    - **Property 5: Insufficient Credit Rejection**
    - **Validates: Requirements 3.2, 3.3, 3.4**
  
  - [ ]* 9.3 Write unit tests for AlanSearch credit logic
    - Test search with sufficient credits succeeds
    - Test search with zero credits fails with 402 status
    - Test search with unlimited tier bypasses credit check
    - Test credit is decremented after successful search
    - _Requirements: 5.3_

- [~] 10. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Create admin pricing management frontend page
  - [x] 11.1 Create frontend/app/[locale]/admin/pricing/page.tsx
    - Create table displaying all pricing plans
    - Show plan_id, TRY price, USD price, override status
    - Add inline editing for price fields
    - Add Save and Reset buttons per plan
    - Implement client-side validation (positive numbers)
    - _Requirements: 2.1, 2.2, 2.6_
  
  - [x] 11.2 Implement API integration for pricing management
    - Fetch pricing data from GET /api/admin/pricing
    - Send updates to PUT /api/admin/pricing/{plan_id}
    - Send reset requests to DELETE /api/admin/pricing/{plan_id}
    - Handle loading states and error messages
    - Show success notifications on save
    - _Requirements: 2.3, 2.4_
  
  - [x] 11.3 Add navigation link to admin pricing page
    - Add "Pricing Management" link to admin navigation menu
    - Ensure proper authentication check
    - _Requirements: 2.1_

- [ ] 12. Update frontend pricing display
  - [~] 12.1 Verify frontend pricing pages use API correctly
    - Check that pricing page fetches from /api/pricing/plans
    - Verify currency selection works correctly
    - Ensure new prices display correctly
    - _Requirements: 1.5, 4.3_

- [ ] 13. Integration testing
  - [ ]* 13.1 Write integration test for end-to-end pricing flow
    - Admin updates pricing → API returns new price → Frontend displays new price
    - _Requirements: 5.1, 5.4_
  
  - [ ]* 13.2 Write integration test for new user AlanSearch flow
    - User registers → Has 1 credit → Performs search → Credit decremented → Second search fails
    - _Requirements: 5.2, 5.3_
  
  - [ ]* 13.3 Write integration test for admin pricing management
    - Admin views pricing → Updates price → Verifies persistence → Resets → Verifies default
    - _Requirements: 5.4_

- [~] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Backend uses Python (FastAPI, SQLAlchemy)
- Frontend uses TypeScript (Next.js, React)
- Database migration should be tested on a development database first
