# Unused Files Cleanup

## Overview
This document identifies and proposes the removal of unused or redundant files in the AT-Supply-Finder project to improve maintainability and reduce clutter.

## Repository Type
Full-Stack Application (React + Vite + TypeScript frontend with Express.js backend)

## Unused Files Analysis

### 1. Duplicate/Redundant Components
- **File**: `src/components/admin/ProductManagement.tsx`
- **Reason**: This component is superseded by `ProductManagementRefactored.tsx` which is the one actually used in the AdminProducts page.
- **Evidence**: 
  - `src/pages/admin/AdminProducts.tsx` imports and uses `ProductManagementRefactored`
  - Both files implement the same functionality but `ProductManagementRefactored` is the active one

### 2. Empty/Mock Data Files
These JSON files appear to be placeholders from the migration process and contain no actual data:
- **Files**:
  - `migration/audit_logs.json` (empty array)
  - `migration/template_products.json` (empty array)
  - `migration/user_favorites.json` (empty array)
  - `migration/user_kits.json` (empty array)
  - `migration/users.json` (empty array)
  - `migration/vendor_offers.json` (empty array)

### 3. Test Files (Per User Preference)
As per user memory preferences, test files should be removed:
- **File**: `src/lib/__tests__/test-appwrite-system-settings.ts`
- **Reason**: Test file that is not part of the main application flow

### 4. Migration Scripts (Possibly Obsolete)
The entire migration directory may be obsolete if the migration has been completed:
- **Directory**: `migration/`
- **Contents**: Scripts and files related to migrating from Supabase to Appwrite
- **Reason**: The application now uses Appwrite, and these migration scripts were likely one-time use tools

### 5. System Settings Test Script
- **File**: `scripts/test-system-settings.cjs`
- **Reason**: Appears to be a test script for system settings functionality that is not part of the main application

## Files to Keep (Not Unused)
After analysis, these files that might seem unused are actually important:

### 1. Functions Directory
- All files in `functions/` are actively used by the Express server (`server.js`)
- The server imports and uses these functions for Amazon API integration

### 2. Refactored Components
- `ProductManagementRefactored.tsx` is the active component being used

### 3. Core Application Files
- All files in `src/` directory are part of the main application structure

## Recommended Cleanup Actions

### Immediate Removals
1. Remove `src/components/admin/ProductManagement.tsx` (superseded by refactored version)
2. Remove all empty JSON files in `migration/` directory:
   - `migration/audit_logs.json`
   - `migration/template_products.json`
   - `migration/user_favorites.json`
   - `migration/user_kits.json`
   - `migration/users.json`
   - `migration/vendor_offers.json`
3. Remove test file: `src/lib/__tests__/test-appwrite-system-settings.ts`
4. Remove test script: `scripts/test-system-settings.cjs`

### Consideration for Removal
1. The entire `migration/` directory if the Supabase to Appwrite migration is complete and no longer needed

### Files to Keep
1. All files in `functions/` directory (actively used by server)
2. All files in `src/` directory (core application)
3. `server.js` (Express backend)
4. Configuration files (`package.json`, `vite.config.ts`, etc.)

## Implementation Plan
1. Verify that `ProductManagementRefactored.tsx` contains all functionality from `ProductManagement.tsx`
2. Remove identified unused files
3. Test the application to ensure no functionality is broken
4. Update any documentation if needed