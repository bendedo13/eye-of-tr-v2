# Requirements Document

## Introduction

This feature addresses three critical issues in the pricing and credit system:
1. Updating pricing plans to reflect new pricing structure for Turkey and Global markets
2. Implementing admin panel functionality to dynamically manage pricing
3. Fixing the bug where new users cannot perform their first free domain search (AlanSearch) due to incorrect credit initialization

The system currently has hardcoded pricing in the backend (PRICING_PLANS constant) and a bug where new users receive 1 free AlanSearch credit but still get "no credits remaining" error when attempting their first search.

## Glossary

- **PRICING_PLANS**: Backend constant containing all subscription and credit pack pricing configurations
- **AlanSearch**: OSINT domain search feature that consumes alan_search_credits
- **Admin_Panel**: Web interface for administrators to manage system settings
- **User_Registration**: Process of creating a new user account
- **Credit_System**: System managing user credits for various search types
- **Subscription_Plan**: Monthly or yearly recurring payment plan
- **Credit_Pack**: One-time purchase of search credits
- **TRY**: Turkish Lira currency
- **USD**: United States Dollar currency

## Requirements

### Requirement 1: Update Pricing Plans

**User Story:** As a product manager, I want to update the pricing structure for subscriptions and credit packs, so that the new pricing is reflected across all user-facing interfaces.

#### Acceptance Criteria

1. WHEN the system loads pricing plans, THE System SHALL return monthly subscription price of 299 TRY for Turkey region
2. WHEN the system loads pricing plans, THE System SHALL return monthly subscription price of 14.99 USD for Global region
3. WHEN the system loads pricing plans, THE System SHALL return credit pack price of 59.99 TRY for Turkey region
4. WHEN the system loads pricing plans, THE System SHALL return credit pack price of 2.99 USD for Global region
5. WHEN a user purchases a subscription or credit pack, THE Payment_System SHALL charge the correct amount based on their currency selection

### Requirement 2: Admin Panel Pricing Management

**User Story:** As an administrator, I want to update pricing from the admin panel, so that I can adjust prices without requiring code deployments.

#### Acceptance Criteria

1. WHEN an administrator accesses the pricing management interface, THE Admin_Panel SHALL display all current pricing plans with their prices in both currencies
2. WHEN an administrator updates a price value, THE System SHALL validate that the price is a positive number
3. WHEN an administrator saves updated pricing, THE System SHALL persist the changes to the database
4. WHEN pricing is updated through the admin panel, THE System SHALL immediately reflect the new prices in all pricing API endpoints
5. WHEN pricing is loaded from the database, THE System SHALL fall back to hardcoded defaults if no database values exist
6. WHEN an administrator views the pricing management interface, THE System SHALL indicate which prices are using database values versus defaults

### Requirement 3: Fix New User AlanSearch Credit Bug

**User Story:** As a new user, I want to use my free AlanSearch credit immediately after registration, so that I can try the domain search feature without encountering errors.

#### Acceptance Criteria

1. WHEN a new user completes registration, THE User_Registration SHALL initialize alan_search_credits to 1
2. WHEN a user with alan_search_credits greater than 0 attempts an AlanSearch, THE Credit_System SHALL allow the search to proceed
3. WHEN a user performs an AlanSearch, THE Credit_System SHALL decrement alan_search_credits by 1 only after validating the user has sufficient credits
4. WHEN a user with 0 alan_search_credits attempts an AlanSearch, THE System SHALL return an error message indicating insufficient credits
5. WHEN a user queries their AlanSearch credit balance, THE System SHALL return the current value of alan_search_credits

### Requirement 4: System Architecture and Data Integrity

**User Story:** As a system architect, I want clean separation between pricing configuration, admin management, and credit logic, so that the system remains maintainable and testable.

#### Acceptance Criteria

1. WHEN pricing data is stored in the database, THE System SHALL maintain backward compatibility with existing PRICING_PLANS constant structure
2. WHEN the backend starts, THE System SHALL validate that all required pricing fields are present
3. WHEN frontend requests pricing data, THE System SHALL receive a consistent response format regardless of data source (database or constant)
4. WHEN admin updates are made, THE System SHALL log all pricing changes with timestamp and admin identifier
5. WHEN database pricing values are missing or invalid, THE System SHALL use hardcoded defaults without service interruption

### Requirement 5: Testing and Validation

**User Story:** As a developer, I want comprehensive tests for pricing and credit logic, so that I can verify correctness and prevent regressions.

#### Acceptance Criteria

1. WHEN pricing values are updated, THE Test_Suite SHALL verify that all currency conversions are within acceptable ranges
2. WHEN a new user is created in tests, THE Test_Suite SHALL verify alan_search_credits is initialized to 1
3. WHEN credit consumption is tested, THE Test_Suite SHALL verify credits are only decremented after validation succeeds
4. WHEN admin pricing updates are tested, THE Test_Suite SHALL verify changes persist correctly to the database
5. WHEN pricing API endpoints are tested, THE Test_Suite SHALL verify correct prices are returned for both TRY and USD currencies
